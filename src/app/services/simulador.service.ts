import { Injectable, inject } from '@angular/core';
import { GastoSimulador, GastoConCuota, ProyeccionMes, ProyeccionConfig } from '../models/gasto-simulador.model';
import { Tarjeta } from '../models/tarjeta.model';
import { FirebaseService } from './firebase.service';
import { UtilsService } from './utils.service';

const PROYECCION_CONFIG_KEY = 'proyeccionConfig';

@Injectable({
  providedIn: 'root'
})
export class SimuladorService {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  async guardarConfig(config: ProyeccionConfig): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return;

    const data = {
      simuladorIngresoMensual: config.ingresoMensual,
      simuladorMesesProyeccion: config.mesesProyeccion,
      simuladorFechaCierreTarjeta: config.fechaCierre
    };

    await this.firebaseSvc.updateUserData(user.uid, data);
    localStorage.setItem(PROYECCION_CONFIG_KEY, JSON.stringify(config));
  }

  async obtenerConfig(): Promise<ProyeccionConfig | null> {
    const data = localStorage.getItem(PROYECCION_CONFIG_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }

    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return null;

    const userData = await this.firebaseSvc.getUserData(user.uid) as any;
    if (userData && (userData.simuladorIngresoMensual || userData.simuladorMesesProyeccion)) {
      const config: ProyeccionConfig = {
        id: 'config_principal',
        ingresoMensual: userData.simuladorIngresoMensual || 0,
        mesesProyeccion: userData.simuladorMesesProyeccion || 6,
        fechaCierre: userData.simuladorFechaCierreTarjeta || null,
        fechaActualizacion: new Date()
      };
      localStorage.setItem(PROYECCION_CONFIG_KEY, JSON.stringify(config));
      return config;
    }

    return null;
  }

  async eliminarConfig(): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (user?.uid) {
      await this.firebaseSvc.updateUserData(user.uid, {
        simuladorIngresoMensual: null,
        simuladorMesesProyeccion: null,
        simuladorFechaCierreTarjeta: null
      });
    }
    localStorage.removeItem(PROYECCION_CONFIG_KEY);
  }

  async guardarGasto(gasto: GastoSimulador): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) {
      return;
    }

    await this.firebaseSvc.addGastoSimulador(user.uid, gasto);
  }

  async obtenerGastos(): Promise<GastoSimulador[]> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return [];

    const gastos = await this.firebaseSvc.getGastosSimulador(user.uid) as GastoSimulador[];
    return gastos;
  }

  obtenerTarjetas() {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return;
    const path = `users/${user.uid}/tarjetas`;
    this.firebaseSvc.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => this.utilsSvc.setTarjetas(res),
      error: err => console.error('Error obteniendo tarjetas', err)
    });
  }

  async actualizarGasto(gastoId: string, data: Partial<GastoSimulador>): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return;

    await this.firebaseSvc.updateGastoSimulador(user.uid, gastoId, data);
  }

  async eliminarGasto(gastoId: string): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    if (!user?.uid) return;

    await this.firebaseSvc.deleteGastoSimulador(user.uid, gastoId);
  }

  async eliminarGastosVencidos(gastos?: GastoSimulador[]): Promise<GastoSimulador[]> {
    const lista = gastos && gastos.length ? gastos : await this.obtenerGastos();
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const sobrevivientes: GastoSimulador[] = [];

    for (const gasto of lista) {
      let eliminar = false;

      if (gasto.fechaFin && gasto.tipo === 'temporal') {
        const fechaFin = this.safeParseDate(gasto.fechaFin);
        if (fechaFin && fechaFin < limite) {
          if (gasto.cantidadCuotas && gasto.cantidadCuotas > 0) {
            const ancla = this.obtenerMesAncla(gasto);
            let mesBase: Date | null = ancla;
            if (!mesBase) {
              const fechaInicio = this.safeParseDate(gasto.fechaInicio);
              if (fechaInicio) {
                mesBase = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
              }
            }
            if (mesBase) {
              const cuotaActual = this.mesesEntre(mesBase, new Date(hoy.getFullYear(), hoy.getMonth(), 1)) + 1;
              eliminar = cuotaActual > gasto.cantidadCuotas;
            }
          } else {
            eliminar = true;
          }
        }
      }

      if (eliminar) {
        try {
          await this.eliminarGasto(gasto.id);
        } catch (e) {
          console.error('Error eliminando gasto vencido', e);
          sobrevivientes.push(gasto);
        }
      } else {
        sobrevivientes.push(gasto);
      }
    }

    return sobrevivientes;
  }

  calcularProyeccion(
    ingresoMensual: number,
    meses: number,
    gastosFijos: GastoSimulador[],
    gastosTemporales: GastoSimulador[],
    cierrePorGasto: (gasto: GastoSimulador) => number | null = () => null,
    offsetMeses: number = 0
  ): ProyeccionMes[] {
    const proyecciones: ProyeccionMes[] = [];
    const fechaActual = new Date();

    for (let i = offsetMeses; i < meses + offsetMeses; i++) {
      const fechaMes = this.sumarMeses(fechaActual, i);

      let gastosFijosMes: GastoSimulador[] = [];
      let gastosTemporalesMes: GastoConCuota[] = [];

      try {
        gastosFijosMes = gastosFijos.filter(g => this.esGastoValidoParaMes(g, fechaMes, null));
      } catch (e) {
        console.error(`Error filtrando gastos fijos:`, e);
      }

      try {
        const tempGastos = gastosTemporales.filter(g => this.esGastoValidoParaMes(g, fechaMes, cierrePorGasto(g)));
        gastosTemporalesMes = tempGastos.map(gasto => {
          const cuotaInfo = this.calcularInfoCuota(gasto, fechaMes, i, cierrePorGasto(gasto));
          return { ...gasto, ...cuotaInfo };
        });
      } catch (e) {
        console.error(`Error filtrando gastos temporales:`, e);
      }

      const totalFijos = this.sumarImportes(gastosFijosMes);
      const totalTemporales = this.sumarImportes(gastosTemporalesMes);
      const totalGastos = totalFijos + totalTemporales;
      const saldoRestante = ingresoMensual - totalGastos;

      const diasTotalesMes = this.getDiasTotalesMes(fechaMes);
      const diaActual = fechaActual.getDate();
      const esMesActual = i === offsetMeses;
      const diasRestantes = esMesActual ? diasTotalesMes - diaActual : diasTotalesMes;
      const presupuestoDiario = diasRestantes > 0 ? Math.floor(saldoRestante / diasRestantes) : 0;
      const gastoDiarioPromedio = diasTotalesMes > 0 ? Math.floor(totalGastos / diasTotalesMes) : 0;

      proyecciones.push({
        mes: fechaMes,
        nombreMes: this.formatearNombreMes(fechaMes),
        numeroMes: fechaMes.getMonth() + 1,
        anio: fechaMes.getFullYear(),
        ingresoEstimado: ingresoMensual,
        totalGastosFijos: totalFijos,
        totalGastosProyectados: totalTemporales,
        totalGastos,
        saldoRestante,
        presupuestoDiario,
        diasRestantesMes: diasRestantes,
        diasTotalesMes,
        gastoDiarioPromedio,
        gastosFijosDelMes: gastosFijosMes,
        gastosProyectadosDelMes: gastosTemporalesMes,
        esNegativo: saldoRestante < 0
      });
    }

    return proyecciones;
  }

  safeParseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    try {
      if (dateValue instanceof Date) return dateValue;
      if (typeof dateValue === 'string') {
        const s = dateValue.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          return new Date(s + 'T00:00:00');
        }
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof dateValue === 'number') {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : this.normalizarFechaGuardada(d);
      }
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        const d = new Date(dateValue.seconds * 1000);
        return isNaN(d.getTime()) ? null : this.normalizarFechaGuardada(d);
      }
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : this.normalizarFechaGuardada(d);
    } catch {
      return null;
    }
  }

  private normalizarFechaGuardada(d: Date): Date {
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    return d;
  }

  fechaACalendarStr(value: any): string {
    const d = this.safeParseDate(value);
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  obtenerDiaCierre(tarjeta: Tarjeta | null): number | null {
    if (!tarjeta || !tarjeta.fecha_cierre) return null;
    const fc: any = tarjeta.fecha_cierre;
    if (typeof fc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fc.trim())) {
      return Number(fc.trim().slice(8, 10));
    }
    const d = this.safeParseDate(fc);
    return d ? d.getDate() : null;
  }

  calcularMesInicioCuotas(fechaInicio: Date, cierreDia: number | null): string {
    let offset = 0;
    if (cierreDia && cierreDia > 0) {
      offset = fechaInicio.getDate() <= cierreDia ? 1 : 2;
    }
    const d = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  obtenerMesAncla(gasto: GastoSimulador): Date | null {
    if (gasto.tipo !== 'temporal' || !gasto.mesInicioCuotas) return null;
    const partes = String(gasto.mesInicioCuotas).split('-').map(Number);
    const anio = partes[0];
    const mes = partes[1];
    if (!anio || !mes || mes < 1 || mes > 12) return null;
    return new Date(anio, mes - 1, 1);
  }

  obtenerMesInicioEfectivo(gasto: GastoSimulador, fechaInicio: Date, fechaCierreDia: number | null): Date {
    const ancla = this.obtenerMesAncla(gasto);
    if (ancla) return ancla;

    if (gasto.tipo === 'temporal' && fechaCierreDia && fechaCierreDia > 0) {
      if (fechaInicio.getDate() <= fechaCierreDia) {
        return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 1);
      }
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 2, 1);
    }
    return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
  }

  obtenerRangoMesesCuotas(gasto: GastoSimulador, fechaCierreDia: number | null): { mesInicio: Date, mesFin: Date | null } | null {
    const fechaInicio = this.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return null;
    const fechaFin = gasto.fechaFin ? this.safeParseDate(gasto.fechaFin) : null;

    const mesInicio = this.obtenerMesInicioEfectivo(gasto, fechaInicio, fechaCierreDia);
    let mesFin: Date | null = null;

    const ancla = this.obtenerMesAncla(gasto);
    if (ancla) {
      if (gasto.cantidadCuotas && gasto.cantidadCuotas > 0) {
        mesFin = new Date(ancla.getFullYear(), ancla.getMonth() + gasto.cantidadCuotas - 1, 1);
      } else if (fechaFin) {
        const duracion = this.mesesEntre(fechaInicio, fechaFin) - 1;
        mesFin = new Date(ancla.getFullYear(), ancla.getMonth() + duracion, 1);
      }
    } else if (gasto.tipo === 'temporal' && fechaCierreDia && fechaFin) {
      if (fechaInicio.getDate() <= fechaCierreDia) {
        mesFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
      } else {
        mesFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth() + 1, 1);
      }
    } else if (fechaFin) {
      mesFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
    }

    return { mesInicio, mesFin };
  }

  mesesEntre(desde: Date, hasta: Date): number {
    return (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
  }

  async anclarGastosLegacy(gastos: GastoSimulador[], tarjetas: Tarjeta[]): Promise<GastoSimulador[]> {
    if (!gastos || gastos.length === 0 || !tarjetas || tarjetas.length === 0) return gastos;

    const user = this.utilsSvc.obtenerDatosLS('user');
    const resultado = [...gastos];

    for (let i = 0; i < resultado.length; i++) {
      const gasto = resultado[i];
      if (gasto.tipo !== 'temporal' || !gasto.tarjetaId || gasto.mesInicioCuotas) continue;

      const tarjeta = tarjetas.find(t => t.id === gasto.tarjetaId);
      const cierreDia = tarjeta ? this.obtenerDiaCierre(tarjeta) : null;
      const fechaInicio = this.safeParseDate(gasto.fechaInicio);
      if (!fechaInicio) continue;

      const ancla = this.calcularMesInicioCuotas(fechaInicio, cierreDia);
      resultado[i] = { ...gasto, mesInicioCuotas: ancla };

      try {
        if (user?.uid) {
          await this.firebaseSvc.updateDocument(`users/${user.uid}/gastosSimulador/${gasto.id}`, { mesInicioCuotas: ancla });
        }
      } catch (e) {
        console.error('Error anclando gasto legacy', e);
      }
    }

    return resultado;
  }

  private esGastoValidoParaMes(gasto: GastoSimulador, fechaMes: Date, fechaCierreDia: number | null): boolean {
    try {
      const rango = this.obtenerRangoMesesCuotas(gasto, fechaCierreDia);
      if (!rango) return false;

      const mesAnioProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

      if (mesAnioProyeccion < rango.mesInicio) {
        return false;
      }
      if (rango.mesFin && mesAnioProyeccion > rango.mesFin) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  private sumarMeses(fecha: Date, meses: number): Date {
    const result = new Date(fecha);
    result.setMonth(result.getMonth() + meses);
    return result;
  }

  private getDiasTotalesMes(fecha: Date): number {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  }

  private sumarImportes(gastos: GastoSimulador[]): number {
    return gastos.reduce((sum, g) => sum + g.importe, 0);
  }

  private formatearNombreMes(fecha: Date): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  }

  private calcularInfoCuota(gasto: GastoSimulador, fechaMes: Date, indiceMes: number, fechaCierreDia: number | null): Partial<GastoConCuota> {
    if (!gasto.cantidadCuotas || gasto.cantidadCuotas <= 0) {
      return {};
    }

    const fechaInicio = this.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return {};

    const mesAnioGasto = this.obtenerMesInicioEfectivo(gasto, fechaInicio, fechaCierreDia);
    const mesAnioProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

    const mesesDesdeInicio = this.mesesEntre(mesAnioGasto, mesAnioProyeccion);

    if (mesesDesdeInicio < 0) return {};

    const numeroCuota = Math.min(mesesDesdeInicio + 1, gasto.cantidadCuotas);
    const cuotasRestantes = gasto.cantidadCuotas - numeroCuota;

    return {
      numeroCuota,
      totalCuotas: gasto.cantidadCuotas,
      cuotasRestantes,
      esUltimaCuota: cuotasRestantes === 0
    };
  }

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-AR');
  }

  formatearMonto(monto: number): string {
    return '$' + this.formatearNumero(monto);
  }

  crearId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  debeOcultarMesActual(): boolean {
    const hoy = new Date();
    return hoy.getDate() > 10;
  }

  getOffsetMeses(): number {
    return this.debeOcultarMesActual() ? 1 : 0;
  }
}

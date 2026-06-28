import { Injectable, inject } from '@angular/core';
import { GastoSimulador, GastoConCuota, ProyeccionMes, ProyeccionConfig } from '../models/gasto-simulador.model';
import { FirebaseService } from './firebase.service';
import { UtilsService } from './utils.service';

const PROYECCION_CONFIG_KEY = 'proyeccionConfig';

@Injectable({
  providedIn: 'root'
})
export class SimuladorService {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  guardarConfig(config: ProyeccionConfig): void {
    localStorage.setItem(PROYECCION_CONFIG_KEY, JSON.stringify(config));
  }

  obtenerConfig(): ProyeccionConfig | null {
    const data = localStorage.getItem(PROYECCION_CONFIG_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  eliminarConfig(): void {
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

  async eliminarGastosVencidos(): Promise<void> {
    const gastos = await this.obtenerGastos();
    const hoy = new Date();

    for (const gasto of gastos) {
      if (gasto.fechaFin) {
        const fechaFin = this.safeParseDate(gasto.fechaFin);
        if (fechaFin && fechaFin < hoy) {
          await this.eliminarGasto(gasto.id);
        }
      }
    }
  }

  calcularProyeccion(
    ingresoMensual: number,
    meses: number,
    gastosFijos: GastoSimulador[],
    gastosTemporales: GastoSimulador[],
    fechaCierreDia: number | null = null,
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
        const tempGastos = gastosTemporales.filter(g => this.esGastoValidoParaMes(g, fechaMes, fechaCierreDia));
        gastosTemporalesMes = tempGastos.map(gasto => {
          const cuotaInfo = this.calcularInfoCuota(gasto, fechaMes, i);
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
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof dateValue === 'number') {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
      }
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000);
      }
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  private esGastoValidoParaMes(gasto: GastoSimulador, fechaMes: Date, fechaCierreDia: number | null): boolean {
    try {
      const fechaInicio = this.safeParseDate(gasto.fechaInicio);
      const fechaFin = gasto.fechaFin ? this.safeParseDate(gasto.fechaFin) : null;

      if (!fechaInicio) {
        return false;
      }

      let mesAnioGasto: Date;
      let mesAnioFin: Date | null = null;

      if (gasto.tipo === 'temporal' && fechaCierreDia) {
        if (fechaInicio.getDate() <= fechaCierreDia) {
          mesAnioGasto = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 1);
        } else {
          mesAnioGasto = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 2, 1);
        }
        if (fechaFin) {
          if (fechaInicio.getDate() <= fechaCierreDia) {
            mesAnioFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
          } else {
            mesAnioFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth() + 1, 1);
          }
        }
      } else {
        mesAnioGasto = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
        if (fechaFin) {
          mesAnioFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
        }
      }

      const mesAnioProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

      if (mesAnioProyeccion < mesAnioGasto) {
        return false;
      }
      if (mesAnioFin && mesAnioProyeccion > mesAnioFin) {
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

  private calcularInfoCuota(gasto: GastoSimulador, fechaMes: Date, indiceMes: number): Partial<GastoConCuota> {
    if (!gasto.cantidadCuotas || gasto.cantidadCuotas <= 0) {
      return {};
    }

    const fechaInicio = this.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return {};

    const mesAnioGasto = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const mesAnioProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

    const mesesDesdeInicio = (mesAnioProyeccion.getFullYear() - mesAnioGasto.getFullYear()) * 12 +
      (mesAnioProyeccion.getMonth() - mesAnioGasto.getMonth());

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

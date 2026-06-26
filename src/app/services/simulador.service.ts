import { Injectable, inject } from '@angular/core';
import { GastoSimulador, ProyeccionMes } from '../models/gasto-simulador.model';
import { FirebaseService } from './firebase.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class SimuladorService {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  async guardarGasto(gasto: GastoSimulador): Promise<void> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    console.log('guardarGasto - user:', user);
    if (!user?.uid) {
      console.error('No user.uid found');
      return;
    }

    console.log('Saving gasto to path:', `users/${user.uid}/gastosSimulador`, gasto);
    await this.firebaseSvc.addGastoSimulador(user.uid, gasto);
    console.log('Gasto saved successfully');
  }

  async obtenerGastos(): Promise<GastoSimulador[]> {
    const user = this.utilsSvc.obtenerDatosLS('user');
    console.log('obtenerGastos - user:', user);
    if (!user?.uid) return [];

    const gastos = await this.firebaseSvc.getGastosSimulador(user.uid) as GastoSimulador[];
    console.log('Gastos loaded:', gastos);
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
    fechaCierreDia: number | null = null
  ): ProyeccionMes[] {
    const proyecciones: ProyeccionMes[] = [];
    const fechaActual = new Date();

    console.log(`=== calcularProyeccion ===`);
    console.log(`fechaActual=${fechaActual.toISOString()}, meses=${meses}, fechaCierreDia=${fechaCierreDia}`);
    console.log(`gastosFijos count: ${gastosFijos.length}`);
    console.log(`gastosTemporales count: ${gastosTemporales.length}`);

    for (let i = 0; i < meses; i++) {
      const fechaMes = this.sumarMeses(fechaActual, i);
      console.log(`\n--- Mes ${i}: ${fechaMes.toISOString()} ---`);

      let gastosFijosMes: GastoSimulador[] = [];
      let gastosTemporalesMes: GastoSimulador[] = [];

      try {
        gastosFijosMes = gastosFijos.filter(g => this.esGastoValidoParaMes(g, fechaMes, null));
      } catch (e) {
        console.error(`Error filtrando gastos fijos:`, e);
      }

      try {
        gastosTemporalesMes = gastosTemporales.filter(g => this.esGastoValidoParaMes(g, fechaMes, fechaCierreDia));
      } catch (e) {
        console.error(`Error filtrando gastos temporales:`, e);
      }

      console.log(`gastosFijosMes count: ${gastosFijosMes.length}`);
      console.log(`gastosTemporalesMes count: ${gastosTemporalesMes.length}`);

      const totalFijos = this.sumarImportes(gastosFijosMes);
      const totalTemporales = this.sumarImportes(gastosTemporalesMes);
      const totalGastos = totalFijos + totalTemporales;
      const saldoRestante = ingresoMensual - totalGastos;

      const diasTotalesMes = this.getDiasTotalesMes(fechaMes);
      const diaActual = fechaActual.getDate();
      const esMesActual = i === 0;
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
        console.log(`  esGastoValidoParaMes: fechaInicio inválida para gasto ${gasto.nombre}`);
        return false;
      }

      console.log(`  esGastoValidoParaMes: gasto=${gasto.nombre}, tipo=${gasto.tipo}, fechaInicio=${fechaInicio.toISOString()}, fechaFin=${fechaFin?.toISOString()}`);
      console.log(`    fechaMes=${fechaMes.toISOString()}, fechaCierreDia=${fechaCierreDia}`);

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

      console.log(`    mesAnioGasto=${mesAnioGasto.toISOString()}, mesAnioFin=${mesAnioFin?.toISOString()}, mesAnioProyeccion=${mesAnioProyeccion.toISOString()}`);

      if (mesAnioProyeccion < mesAnioGasto) {
        console.log(`    Result: false (proyeccion < gasto)`);
        return false;
      }
      if (mesAnioFin && mesAnioProyeccion > mesAnioFin) {
        console.log(`    Result: false (proyeccion > fin)`);
        return false;
      }

      console.log(`    Result: true`);
      return true;
    } catch (e) {
      console.error(`  Error en esGastoValidoParaMes para gasto ${gasto.nombre}:`, e);
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

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-AR');
  }

  formatearMonto(monto: number): string {
    return '$' + this.formatearNumero(monto);
  }

  crearId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

import { Injectable } from '@angular/core';
import { GastoProyectado, ProyeccionMes } from '../models/gasto-proyectado.model';

@Injectable({
  providedIn: 'root'
})
export class SimuladorService {

  calcularProyeccion(
    ingresoMensual: number,
    meses: number,
    gastosFijos: GastoProyectado[],
    gastosTemporales: GastoProyectado[]
  ): ProyeccionMes[] {
    const proyecciones: ProyeccionMes[] = [];
    const fechaActual = new Date();

    for (let i = 0; i < meses; i++) {
      const fechaMes = this.sumarMeses(fechaActual, i);
      const gastosFijosMes = gastosFijos.filter(g => this.esGastoValidoParaMes(g, fechaMes));
      const gastosTemporalesMes = gastosTemporales.filter(g => this.esGastoValidoParaMes(g, fechaMes));

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

  private esGastoValidoParaMes(gasto: GastoProyectado, fechaMes: Date): boolean {
    const fechaInicio = new Date(gasto.fechaInicio);
    const fechaFin = gasto.fechaFin ? new Date(gasto.fechaFin) : null;

    const mesAnioGasto = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const mesAnioProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

    if (mesAnioProyeccion < mesAnioGasto) return false;
    if (fechaFin) {
      const mesAnioFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
      if (mesAnioProyeccion > mesAnioFin) return false;
    }

    return true;
  }

  private sumarMeses(fecha: Date, meses: number): Date {
    const result = new Date(fecha);
    result.setMonth(result.getMonth() + meses);
    return result;
  }

  private getDiasTotalesMes(fecha: Date): number {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  }

  private sumarImportes(gastos: GastoProyectado[]): number {
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

  crearId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

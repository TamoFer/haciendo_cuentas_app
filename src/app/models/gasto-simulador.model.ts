export interface GastoSimulador {
  id: string;
  nombre: string;
  tipo: 'fijo' | 'temporal';
  importe: number;
  categoria: string;
  fechaInicio: Date;
  fechaFin?: Date;
  cantidadCuotas?: number;
  detalles?: string;
  fechaCreacion: Date;
}

export interface ProyeccionMes {
  mes: Date;
  nombreMes: string;
  numeroMes: number;
  anio: number;
  ingresoEstimado: number;
  totalGastosFijos: number;
  totalGastosProyectados: number;
  totalGastos: number;
  saldoRestante: number;
  presupuestoDiario: number;
  diasRestantesMes: number;
  diasTotalesMes: number;
  gastoDiarioPromedio: number;
  gastosFijosDelMes: GastoSimulador[];
  gastosProyectadosDelMes: GastoSimulador[];
  esNegativo: boolean;
}

export interface GastoProyectado {
  id: string;
  nombre: string;
  tipo: 'cuota' | 'recurrente' | 'unico';
  importe: number;
  fechaInicio: Date;
  fechaFin?: Date;
  esFijo: boolean;
  categoria: string;
  detalles?: string;
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
  gastosFijosDelMes: GastoProyectado[];
  gastosProyectadosDelMes: GastoProyectado[];
  esNegativo: boolean;
}

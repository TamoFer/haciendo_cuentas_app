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

export interface GastoConCuota extends GastoSimulador {
  numeroCuota?: number;
  totalCuotas?: number;
  cuotasRestantes?: number;
  esUltimaCuota?: boolean;
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
  gastosProyectadosDelMes: GastoConCuota[];
  esNegativo: boolean;
}

export interface ProyeccionConfig {
  id: string;
  ingresoMensual: number;
  mesesProyeccion: number;
  fechaCierre: number | null;
  fechaActualizacion: Date;
}

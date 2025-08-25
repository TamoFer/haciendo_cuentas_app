import { Tarjeta } from "./tarjeta.model";

export interface Consumo {
    id: string;
    fecha: Date;
    importe_total: number;
    cuotificacion: number;
    tarjeta_asociada: Tarjeta
    detalle: string
    moneda: string

}
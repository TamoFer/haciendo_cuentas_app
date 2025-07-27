import { Tarjeta } from "./tarjeta.model";

export interface Consumo {
    id: string;
    fecha: Date;
    importe: number;
    cuotas: number;
    tarjeta_asociada: Tarjeta
    detalle: string

}
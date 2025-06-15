import { Consumo } from "./consumoTarjeta.model";

export interface Tarjeta {
    id?: Number;
    digitos: Number;
    fecha_cierre: Date;
    banco: string;
    tarjeta: string;
    consumos: Consumo[];

}
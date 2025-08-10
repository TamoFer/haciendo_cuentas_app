import { Consumo } from "./consumoTarjeta.model";

export interface Tarjeta {
    id: string;
    digitos: Number;
    fecha_cierre: Date;
    banco: string;
    tarjeta: string;

}
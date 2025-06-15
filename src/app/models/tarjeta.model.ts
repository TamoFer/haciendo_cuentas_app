import { Consumo } from "./consumoTarjeta.model";

export interface Tarjeta {
    id: Number;
    fecha_cierre: Date;
    entidad_bancaria: string;
    tipo_tarjeta: string;
    consumos: Consumo[];

}
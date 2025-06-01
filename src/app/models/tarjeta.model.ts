import { Consumo } from "./consumoTarjeta.model";

export interface Tarjeta {
    id: string;
    fecha_vencimientos: Date;
    fecha_cierre: Date;
    entidad_bancaria: string;
    tipo_tarjeta: string;
    consumos: Consumo[];

}
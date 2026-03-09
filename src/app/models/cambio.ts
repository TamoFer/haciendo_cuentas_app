export interface Cambio {
    id: string;
    importe: number;
    moneda?: string;
    fecha: string | Date;
    desde: string;
    hacia: string;
    saldo_efectivo_anterior: number;
    saldo_efectivo_actualizado: number;
    saldo_banco_anterior: number;
    saldo_banco_actualizado: number;

}

import { Movimiento } from "./movimiento.model";
import { Tarjeta } from "./tarjeta.model";

export interface User {
    uid: string;
    email: string;
    password: string;
    name: string;
    saldo_banco: number;
    saldo_efectivo: number;
    movimientos: Movimiento[];
    censurar_montos: boolean;
    tarjetas: Tarjeta[];
}


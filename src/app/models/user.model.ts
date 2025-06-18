import { Movimiento } from "./movimiento.mode";

export interface User {
    uid: string;
    email: string;
    password: string;
    name: string;
    saldo_banco: number;
    saldo_efectivo: number;
    censurar_montos: boolean;
    movimientos: Movimiento[]
}


import { Gasto } from "./gasto.model";
import { Ingreso } from "./ingreso.model";

export interface User {
    uid: string;
    email: string;
    password: string;
    name: string;
    saldo_banco: number;
    saldo_efectivo: number;
    gastos: Gasto[];
    ingresos: Ingreso[];
}


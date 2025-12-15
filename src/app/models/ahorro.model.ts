import { Meta } from "./metas.model";

export interface Ahorro {
  id: string;
  importe: Number;
  fecha: Date;
  detalle: string;
  moneda: string;
  meta?: Meta;

}

import { Meta } from "./metas.model";

export interface Ahorro {
  id: string;
  importe: number;
  fecha: Date;
  detalle: string;
  moneda: string;
  idMeta?: string;

}

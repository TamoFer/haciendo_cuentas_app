import { Ahorro } from "./ahorro.model";

export interface Meta {
  id: string;
  valor: number;
  moneda: string;
  fecha_comienzo: Date;
  nombre: string;
  detalle: string;
  ahorrado?: Ahorro[];

}

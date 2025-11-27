import { Ahorro } from "./ahorro.model";

export interface Meta {
  id: string;
  valor: Number;
  fecha_comienzo: Date;
  nombre: string;
  detalle: string;
  fecha_objetivo?: Date;
  ahorrado: Ahorro[];


}

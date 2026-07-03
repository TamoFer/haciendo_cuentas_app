import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DolarCotizacion {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private baseUrl = 'https://dolarapi.com/v1/dolares';

  constructor(private http: HttpClient) { }

  obtenerCotizacion(tipo: 'oficial' | 'blue' | 'bolsa' | 'tarjeta'): Observable<DolarCotizacion> {
    return this.http.get<DolarCotizacion>(`${this.baseUrl}/${tipo}`);
  }

  obtenerCotizacionDolarOficial() {
    return this.obtenerCotizacion('oficial');
  }

  obtenerCotizacionDolarTarjeta() {
    return this.obtenerCotizacion('tarjeta');
  }
}

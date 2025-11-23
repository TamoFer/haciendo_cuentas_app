import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private apiUrlOficial: string = 'https://dolarapi.com/v1/dolares/oficial';
  private apiUrlTarjeta: string = 'https://dolarapi.com/v1/dolares/tarjeta';


  constructor(private http: HttpClient) { }

  obtenerCotizacionDolarOficial() {
    return this.http.get<any>(this.apiUrlOficial);
  }

  obtenerCotizacionDolarTarjeta() {
    return this.http.get<any>(this.apiUrlTarjeta);
  }
}

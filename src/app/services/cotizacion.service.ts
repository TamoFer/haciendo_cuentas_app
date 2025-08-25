import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private apiUrl: string = 'https://dolarapi.com/v1/dolares/oficial';
  constructor(private http: HttpClient) { }

  obtenerCotizacionDolar() {
    return this.http.get<any>(this.apiUrl);
  }
}
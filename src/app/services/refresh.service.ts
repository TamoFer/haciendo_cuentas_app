import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class RefreshService {

  private actualizarDatos$ = new BehaviorSubject<boolean>(false);

  get actualizarDatos() {
    return this.actualizarDatos$.asObservable();
  }

  triggerActualizar() {
    this.actualizarDatos$.next(true);
  }
}



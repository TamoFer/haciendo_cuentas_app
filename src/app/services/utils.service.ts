import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { Movimiento } from '../models/movimiento.mode';
import Swal from 'sweetalert2'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  router = inject(Router);
  alertasCtrl = inject(AlertController);
  modalsCtrl = inject(ModalController);
  sweetAlert = Swal;

  // NUEVO: BehaviorSubject del usuario
  private userSubject = new BehaviorSubject<User>(this.obtenerDatosLS('user'));
  user$ = this.userSubject.asObservable(); // observable que se suscriben los componentes

  // ✅ Subject para los movimientos
  private movimientosSubject = new BehaviorSubject<Movimiento[]>([]);
  movimientos$ = this.movimientosSubject.asObservable();

  // NUEVO: obtener el valor actual del usuario
  getUserActual(): User {
    return this.userSubject.getValue();
  }

  // NUEVO: actualizar el usuario (localStorage y subject)
  setUser(user: User) {
    this.guardarDatosLS('user', user); // actualiza storage y dispara el observable
  }

  // ✅ Obtener los movimientos actuales
  getMovimientosActuales(): Movimiento[] {
    return this.movimientosSubject.getValue();
  }

  // ✅ Establecer movimientos
  setMovimientos(movimientos: Movimiento[]) {
    this.movimientosSubject.next(movimientos);
  }

  // ✅ Agregar movimiento (opcional helper)
  agregarMovimiento(nuevo: Movimiento) {
    const actualizados = [nuevo, ...this.getMovimientosActuales()];
    this.setMovimientos(actualizados);
  }

  // ✅ Editar movimiento
  actualizarMovimiento(actualizado: Movimiento) {
    const lista = this.getMovimientosActuales().map(m =>
      m.id === actualizado.id ? actualizado : m
    );
    this.setMovimientos(lista);
  }

  // ✅ Eliminar movimiento
  eliminarMovimiento(id: number | string) {
    const lista = this.getMovimientosActuales().filter(m => m.id !== id);
    this.setMovimientos(lista);
  }

  // Spinner loading 
  loading() {
    return this.loadingCtrl.create({ spinner: 'crescent' })
  }

  // Toast notificación 
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts)
    toast.present();
  }

  // Navegación
  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  // Guardar datos en localStorage
  guardarDatosLS(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));

    // NUEVO: si es el usuario, notificamos el cambio
    if (key === 'user') {
      this.userSubject.next(value);
    }
  }

  // Obtener datos desde localStorage
  obtenerDatosLS(key: string) {
    return JSON.parse(localStorage.getItem(key));
  }

  // Mostrar modal
  async presentModal(opts: ModalOptions) {
    const modal = await this.modalsCtrl.create(opts);
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) return data;
  }

  // Cerrar modal
  dismissModal(data?: any) {
    return this.modalsCtrl.dismiss(data);
  }



}



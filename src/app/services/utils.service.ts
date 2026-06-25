import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { Movimiento } from '../models/movimiento.model';
import { Tarjeta } from '../models/tarjeta.model';
import { Consumo } from '../models/consumoTarjeta.model';
import { MetasPageModule } from '../pages/main/metas/metas.module';
import { Meta } from '../models/metas.model';
import { Ahorro } from '../models/ahorro.model';
import { Cambio } from '../models/cambio';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  // @section: controladores
  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  router = inject(Router);
  alertasCtrl = inject(AlertController);
  modalsCtrl = inject(ModalController);
  // @endsection



  // @section: usuario
  // NUEVO: BehaviorSubject del usuario
  private userSubject = new BehaviorSubject<User>(this.obtenerDatosLS('user'));
  user$ = this.userSubject.asObservable(); // observable que se suscriben los componentes

  // NUEVO: obtener el valor actual del usuario
  getUserActual(): User {
    return this.userSubject.getValue();
  }

  // NUEVO: actualizar el usuario (localStorage y subject)
  setUser(user: User) {
    this.guardarDatosLS('user', user); // actualiza storage y dispara el observable
  }

  crearId() {
    let max: number = 1000;
    let randomNumber: number = Math.floor(Math.random() * max);
    return randomNumber
  }
  // @endsection


  // @section: movimientos
  // ✅ Subject para los movimientos


  private movimientosSubject = new BehaviorSubject<Movimiento[]>([]);
  movimientos$ = this.movimientosSubject.asObservable();

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

  // @endsection


  // @section: tarjetas

  // ✅ Subject para los tarjetas
  private tarjetasSubject = new BehaviorSubject<Tarjeta[]>([]);
  tarjetas$ = this.tarjetasSubject.asObservable();

  // ✅ Obtener los tarjetas actuales
  getTarjetasActuales(): Tarjeta[] {
    return this.tarjetasSubject.getValue();
  }

  // ✅ Establecer tarjetas
  setTarjetas(tarjetas: Tarjeta[]) {
    this.tarjetasSubject.next(tarjetas);
  }
  // ✅ Agregar tarjetas (opcional helper)
  agregarTarjeta(nuevo: Tarjeta) {
    const actualizados = [nuevo, ...this.getTarjetasActuales()];
    this.setTarjetas(actualizados);
  }

  // ✅ Editar tarjetas
  actualizarTarjeta(actualizado: Tarjeta) {
    const lista = this.getTarjetasActuales().map(m =>
      m.id === actualizado.id ? actualizado : m
    );
    this.setTarjetas(lista);
  }

  // ✅ Eliminar movimiento
  eliminarTarjeta(id: number | string) {
    const lista = this.getTarjetasActuales().filter(m => m.id !== id);
    this.setTarjetas(lista);
  }


  // @endsection


  // @section: consumos

  // ✅ Subject para los consumos
  private consumosSubject = new BehaviorSubject<Consumo[]>([]);
  consumos$ = this.consumosSubject.asObservable();

  // ✅ Obtener los consumos actuales
  getConsumosActuales(): Consumo[] {
    return this.consumosSubject.getValue();
  }

  // ✅ Establecer consumo
  setConsumos(consumos: Consumo[]) {
    this.consumosSubject.next(consumos);
  }
  // ✅ Agregar consumo (opcional helper)
  agregarConsumo(nuevo: Consumo) {
    const actualizados = [nuevo, ...this.getConsumosActuales()];
    this.setConsumos(actualizados);
  }

  // ✅ Editar consumo
  actualizarConsumos(actualizado: Consumo) {
    const lista = this.getConsumosActuales().map(m =>
      m.id === actualizado.id ? actualizado : m
    );
    this.setConsumos(lista);
  }

  // ✅ Eliminar consumo
  eliminarConsumo(id: number | string) {
    const lista = this.getConsumosActuales().filter(m => m.id !== id);
    this.setConsumos(lista);
  }

  // @endsection


  // @section: metas

  // ✅ Subject para los metas
  private metasSubject = new BehaviorSubject<Meta[]>([]);
  metas$ = this.metasSubject.asObservable();

  // ✅ Obtener los consumos actuales
  getMetasActuales(): Meta[] {
    return this.metasSubject.getValue();
  }

  // ✅ Establecer consumo
  setMetas(metas: Meta[]) {
    this.metasSubject.next(metas);
  }
  // ✅ Agregar consumo (opcional helper)
  agregarMetas(nuevo: Meta) {
    const actualizados = [nuevo, ...this.getMetasActuales()];
    this.setMetas(actualizados);
  }

  // ✅ Editar consumo
  actualizarMetas(actualizado: Meta) {
    const lista = this.getMetasActuales().map(m =>
      m.id === actualizado.id ? actualizado : m
    );
    this.setMetas(lista);
  }

  // ✅ Eliminar consumo
  eliminarMetas(id: number | string) {
    const lista = this.getMetasActuales().filter(m => m.id !== id);
    this.setMetas(lista);
  }

  // @endsection


  // @section: ahorros

  // ✅ Subject para los ahorros
  private ahorrosSubject = new BehaviorSubject<Ahorro[]>([]);
  ahorros$ = this.ahorrosSubject.asObservable();

  // ✅ Obtener los consumos actuales
  getAhorrosActuales(): Ahorro[] {
    return this.ahorrosSubject.getValue();
  }

  // ✅ Establecer consumo
  setAhorros(consumos: Ahorro[]) {
    this.ahorrosSubject.next(consumos);
  }
  // ✅ Agregar consumo (opcional helper)
  agregarAhorros(nuevo: Ahorro) {
    const actualizados = [nuevo, ...this.getAhorrosActuales()];
    this.setAhorros(actualizados);
  }

  // ✅ Editar consumo
  actualizarAhorros(actualizado: Ahorro) {
    const lista = this.getAhorrosActuales().map(m =>
      m.id === actualizado.id ? actualizado : m
    );
    this.setAhorros(lista);
  }

  // ✅ Eliminar consumo
  eliminarAhorro(id: number | string) {
    const lista = this.getAhorrosActuales().filter(m => m.id !== id);
    this.setAhorros(lista);
  }


  // @endsection


  // @section: herramientas

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

  // @endsection


  // @section: local storage

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


  // @endsection


  // @section: modal

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

  // @endsection



  // @section: registros
  // ✅ Subject para los cambios
  private cambiosSubject = new BehaviorSubject<Cambio[]>([]);
  cambios$ = this.cambiosSubject.asObservable();

  // ✅ Obtener los consumos cambios actuales
  getCambiosActuales(): Cambio[] {
    return this.cambiosSubject.getValue();
  }

  // ✅ Establecer cambio
  setCambios(cambios: Cambio[]) {
    this.cambiosSubject.next(cambios);
  }
  // ✅ Agregar cambio (opcional helper)
  agregarCambios(nuevo: Cambio) {
    const actualizados = [nuevo, ...this.getCambiosActuales()];
    this.setCambios(actualizados);
  }

  // ✅ Editar cambio
  actualizarCambios(actualizado: Cambio) {
    const lista = this.getCambiosActuales().map(c =>
      c.id === actualizado.id ? actualizado : c
    );
    this.setCambios(lista);
  }

  // ✅ Eliminar cambio
  eliminarCambio(id: number | string) {
    const lista = this.getCambiosActuales().filter(m => m.id !== id);
    this.setCambios(lista);
  }

}



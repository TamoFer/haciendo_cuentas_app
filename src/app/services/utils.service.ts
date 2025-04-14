import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  router = inject(Router);
  alertasCtrl = inject(AlertController);
  modalsCtrl = inject(ModalController);



  // creacion de spinner loading 
  loading() {
    return this.loadingCtrl.create({ spinner: 'crescent' })
  }

  //  creacion notificacion error login 
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts)
    toast.present();
  }

  // enrutador
  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  //guardar datos usuario en Localstorage
  guardarDatosLS(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value))
  }

  //obtener datos usuario en Localstorage
  obtenerDatosLS(key: string) {
    return JSON.parse(localStorage.getItem(key))
  }




  //crear modal default
  async presentModal(opts: ModalOptions) {
    const modal = await this.modalsCtrl.create(opts);
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) return data;
  }

  dismissModal(data?: any) {
    return this.modalsCtrl.dismiss(data);
  }


}


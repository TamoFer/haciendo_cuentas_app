import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SwalService {

  private getSwalOptions(customOptions?: SweetAlertOptions): SweetAlertOptions {
    const baseOptions: SweetAlertOptions = {
      heightAuto: false,
      backdrop: true,
      allowOutsideClick: false,
      confirmButtonColor: '#0066cc',
      cancelButtonColor: '#999999',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      ...customOptions
    };
    return baseOptions;
  }

  async fire(title: string, text: string, icon: SweetAlertIcon = 'info', customOptions?: SweetAlertOptions) {
    return Swal.fire({
      title,
      text,
      icon,
      ...this.getSwalOptions(customOptions)
    });
  }

  async confirm(title: string, text: string, confirmText: string = 'Eliminar', icon: SweetAlertIcon = 'warning') {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      reverseButtons: true,
      ...this.getSwalOptions()
    });
  }

  async success(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      ...this.getSwalOptions()
    });
  }

  async error(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      ...this.getSwalOptions()
    });
  }

  async warning(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      ...this.getSwalOptions()
    });
  }

  async info(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      ...this.getSwalOptions()
    });
  }

  async deleteConfirm(nombre: string) {
    return this.confirm(
      '¿Eliminar?',
      `¿Estás seguro que deseas eliminar "${nombre}"?`,
      'Eliminar',
      'warning'
    );
  }

  async toast(title: string, icon: SweetAlertIcon = 'success', timer: number = 2000) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'center',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      heightAuto: false,
    });
    return Toast.fire({
      title,
      icon
    });
  }

  async loading(title: string = 'Cargando...') {
    return Swal.fire({
      title,
      html: '<div class="swal-loading"><ion-spinner></ion-spinner></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      heightAuto: false,
      customClass: {
        popup: 'swal-popup'
      }
    });
  }

  close() {
    Swal.close();
  }
}

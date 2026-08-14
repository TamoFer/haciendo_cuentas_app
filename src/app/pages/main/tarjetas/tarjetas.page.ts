import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoOptions, MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { TarjetaAddUpdDeleteComponent } from './tarjeta-add-upd-delete/tarjeta-add-upd-delete.component';
import { ConsumosComponent } from '../consumos/consumos.component';

@Component({
  selector: 'app-tarjetas',
  templateUrl: './tarjetas.page.html',
  styleUrls: ['./tarjetas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, MaskitoDirective, ReactiveFormsModule]
})
export class TarjetasPage implements OnInit {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  nombreUser: string = '';
  tarjetas: Tarjeta[] = [];
  subscripcionUser: Subscription;

  tarjetaExpandidaId: string | null = null;
  showForm = false;

  formulario = new FormGroup({
    id: new FormControl(''),
    digitos: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    fecha_cierre: new FormControl(null, [Validators.required]),
    banco: new FormControl('', [Validators.required]),
    tarjeta: new FormControl('', [Validators.required]),
  });

  readonly cardMask: MaskitoOptions = {
    mask: [...Array(4).fill(/\d/)],
  };

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  bancos = ['Santander', 'Galicia', 'BBVA', 'Otro'];
  marcas = ['Visa', 'Mastercard', 'American Express'];

  ngOnInit() {
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.usuario = user;
        this.nombreUser = user.name;
        this.usuarioLogeado = true;
      }
    });

    this.utilsSVC.tarjetas$.subscribe(tarjetas => {
      this.tarjetas = tarjetas || [];
    });

    this.obtenerTarjetasUsuario();
  }

  obtenerTarjetasUsuario() {
    const path = `users/${this.usuario.uid}/tarjetas`;
    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => this.utilsSVC.setTarjetas(res),
      error: err => console.error('Error obteniendo tarjetas', err)
    });
  }

  toggleExpand(tarjeta: Tarjeta) {
    this.tarjetaExpandidaId = this.tarjetaExpandidaId === tarjeta.id ? null : tarjeta.id;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.formulario.reset();
  }

  async crearTarjeta() {
    if (!this.formulario.valid) return;
    const loading = await this.utilsSVC.loading();
    await loading.present();
    const path = `users/${this.usuario.uid}/tarjetas`;

    const id = String(this.utilsSVC.crearId());
    const data = { ...this.formulario.value, id };

    this.firebaseSVC.addDocument(path, data).then(() => {
      this.utilsSVC.presentToast({
        message: 'Tarjeta creada con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.formulario.reset();
      this.showForm = false;
    }).catch(error => {
      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => loading.dismiss());
  }

  async editarTarjeta(tarjeta: Tarjeta) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: TarjetaAddUpdDeleteComponent,
      componentProps: { tarjeta }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.eliminar) {
      this.eliminarTarjeta(tarjeta);
    }
  }

  async confirmarDelete(tarjeta: Tarjeta) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar Tarjeta',
      message: '¿Estás seguro que deseas eliminarla?',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí', role: 'destructive', handler: () => this.eliminarTarjeta(tarjeta) }
      ]
    });
    await alert.present();
  }

  async eliminarTarjeta(tarjeta: Tarjeta) {
    const loading = await this.utilsSVC.loading();
    await loading.present();
    const path = `users/${this.usuario.uid}/tarjetas/${tarjeta.id}`;

    this.firebaseSVC.deleteDocument(path).then(() => {
      this.utilsSVC.presentToast({
        message: 'Tarjeta eliminada con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    }).catch(error => {
      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => loading.dismiss());

    this.obtenerTarjetasUsuario();
  }

  async verConsumos(tarjeta: Tarjeta) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: ConsumosComponent,
      cssClass: 'modal-fullscreen',
      componentProps: { tarjeta }
    });
    await modal.present();
  }

  async toggleFavorita(tarjeta: Tarjeta) {
    const path = `users/${this.usuario.uid}/tarjetas`;
    const favActiva = this.tarjetas.find(t => t.favorita);

    if (favActiva && favActiva.id === tarjeta.id) {
      await this.firebaseSVC.updateDocument(`${path}/${tarjeta.id}`, { favorita: false });
      this.utilsSVC.actualizarTarjeta({ ...tarjeta, favorita: false });
    } else {
      if (favActiva) {
        await this.firebaseSVC.updateDocument(`${path}/${favActiva.id}`, { favorita: false });
        this.utilsSVC.actualizarTarjeta({ ...favActiva, favorita: false });
      }
      await this.firebaseSVC.updateDocument(`${path}/${tarjeta.id}`, { favorita: true });
      this.utilsSVC.actualizarTarjeta({ ...tarjeta, favorita: true });
    }
  }

  getColorBanco(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return '#c8102e';
      case 'bbva': return '#0033a0';
      case 'galicia': return '#ff6f00';
      default: return '#4a5568';
    }
  }

  getColorBancoGradient(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return 'linear-gradient(135deg, #ec1c24 0%, #c8102e 50%, #a00d23 100%)';
      case 'bbva': return 'linear-gradient(135deg, #0066ff 0%, #0033a0 50%, #00267d 100%)';
      case 'galicia': return 'linear-gradient(135deg, #ff8f00 0%, #ff6f00 50%, #e65100 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4a5568 50%, #374151 100%)';
    }
  }

  getMarcaClass(tarjeta: string): string {
    switch (tarjeta.toLowerCase()) {
      case 'visa': return 'marca-visa';
      case 'mastercard': return 'marca-mastercard';
      case 'american express': return 'marca-amex';
      default: return 'marca-otro';
    }
  }

  getMarcaLabel(tarjeta: string): string {
    switch (tarjeta.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MASTERCARD';
      case 'american express': return 'AMEX';
      default: return tarjeta.toUpperCase();
    }
  }

  getBancoLogo(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return '../../../assets/img/santander.png';
      case 'galicia': return '../../../assets/img/galicia.jpg';
      case 'bbva': return '../../../assets/img/bbva.png';
      case 'otro': return '../../../assets/img/banco.png';
      default: return '../../../assets/img/banco.png';
    }
  }

  formatFechaCierre(fecha: any): string {
    if (!fecha) return '';
    let d: Date;
    if (fecha && typeof fecha.toDate === 'function') {
      d = fecha.toDate();
    } else if (fecha instanceof Date) {
      d = fecha;
    } else if (typeof fecha === 'string') {
      d = new Date(fecha + 'T00:00:00');
    } else {
      d = new Date(fecha);
    }
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
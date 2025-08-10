import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Consumo } from 'src/app/models/consumoTarjeta.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdateDeleteConsumosComponent } from './add-update-delete-consumos/add-update-delete-consumos.component';

@Component({
  selector: 'app-consumos',
  templateUrl: './consumos.component.html',
  styleUrls: ['./consumos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule]
})
export class ConsumosComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  subscripcionUser: Subscription;
  consumosSubscription: Subscription;
  nombreUser: string = '';
  mostrarBack: boolean = true;
  consumos: Consumo[] = [];
  totalConsumos: number = 0;

  @Input() tarjeta: Tarjeta;


  constructor() { }

  ngOnInit() {
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.usuario = user;
        this.nombreUser = user.name;
        this.usuarioLogeado = true;
      }
    });
    this.obtenerConsumosTarjeta();
  }



  async modificarConsumo(consumo?: Consumo) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdateDeleteConsumosComponent,
      componentProps: {
        consumo: consumo
      }
    })
    await modal.present();
  }

  async eliminarConsumo(consumo: Consumo) {
    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.usuario.uid}/tarjetas/${this.tarjeta.id}/consumos/${consumo.id}`;


    this.firebaseSVC.deleteDocument(path).then(async res => {


      this.utilsSVC.presentToast({
        message: 'Consumo eliminado con exito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      })

    }).catch(error => {
      console.log(error);

      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      })

    }).finally(() => {
      loading.dismiss();
    })

  }

  async confirmarDelete(consumo: Consumo) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar Consumo',
      message: '¿Estás seguro que deseas eliminarlo?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Si',
          role: 'destructive',
          handler: () => {
            this.eliminarConsumo(consumo)
          }
        }
      ]
    });

    await alert.present();
  }

  calcularTotal() {
    this.totalConsumos = this.consumos.reduce((acc, consumo) => acc + Number(String(consumo.importe_total).replace(/\./g, '').replace(',', '.')), 0);
  }

  obtenerConsumosTarjeta() {
    if (!this.tarjeta || !this.tarjeta.id) {
      console.warn('Tarjeta no válida');
      return;
    }
    const path = `users/${this.usuario.uid}/tarjetas/${this.tarjeta.id}/consumos`;

    this.consumosSubscription = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Consumo[]) => {
        this.utilsSVC.setConsumos(res);
        this.consumos = res;
        if (this.consumos.length === 0) {
          this.sinConsumos();
        }
        this.calcularTotal();

      },
      error: err => {
        console.error('Error obteniendo consumos', err);
      }
    });
  }

  async sinConsumos() {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Sin consumos',
      message: 'No hay consumos registrados para esta tarjeta.',
      buttons: [

        {
          text: 'OK',
          handler: () => {
            this.cerrarModal();
          }
        }
      ],
    });

    await alert.present();
  }

  ngOnDestroy() {
    if (this.subscripcionUser) {
      this.subscripcionUser.unsubscribe();
    }
    if (this.consumosSubscription) {
      this.consumosSubscription.unsubscribe();
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

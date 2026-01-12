import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { Ahorro } from 'src/app/models/ahorro.model';
import { AddUpdtDeleteAhorrosComponent } from './add-updt-delete-ahorros/add-updt-delete-ahorros.component';
import { Meta } from 'src/app/models/metas.model';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.page.html',
  styleUrls: ['./ahorros.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class AhorrosPage implements OnInit {

  // @section: services
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  // @endsection

  // @section: variables
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  ahorros: Ahorro[] = [];
  metas: Meta[] = [];

  // @endsection

  @Input() ahorro: Ahorro

  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.ahorros$.subscribe(ahorros => {
      this.ahorros = ahorros;
    });

    this.obtenerAhorrosUsuario()

    this.utilsSVC.metas$.subscribe(metas => {
      this.metas = metas;
    });

    this.obtenerMetasUsuario();
  }

  obtenerAhorrosUsuario() {
    const path = `users/${this.usuario.uid}/ahorros`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Ahorro[]) => {
        this.utilsSVC.setAhorros(res);
      },
      error: err => {
        console.error('Error obteniendo ahorros', err);
      }
    });
  }

  obtenerMetasUsuario() {
    const path = `users/${this.usuario.uid}/metas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Meta[]) => {
        this.utilsSVC.setMetas(res);
      },
      error: err => {
        console.error('Error obteniendo metas', err);
      }
    });
  }

  async crearAhorro(ahorro?: Ahorro) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteAhorrosComponent,
      componentProps: {
        ahorro: ahorro // ✅ PASA el movimiento si existe
      }
    });

    await modal.present();
  }

  async eliminarAhorro(ahorro: Ahorro) {
    const loading = await this.utilsSVC.loading();
    await loading.present();

    const path = `users/${this.usuario.uid}/ahorros/${ahorro.id}`;

    try {
      // 1. Eliminar ahorro
      await this.firebaseSVC.deleteDocument(path);

      // 2. Si pertenece a una meta, eliminarlo de la meta

      this.utilsSVC.presentToast({
        message: 'Ahorro eliminado con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

    } catch (error: any) {
      console.error(error);

      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      });

    } finally {
      loading.dismiss();
    }
  }


  async confirmarDelete(ahorro: Ahorro) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar Ahorro',
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
            this.eliminarAhorro(ahorro)
          }
        }
      ]
    });

    await alert.present();
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

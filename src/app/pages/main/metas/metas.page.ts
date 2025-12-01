import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Meta } from 'src/app/models/metas.model';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteMetasComponent } from './add-updt-delete-metas/add-updt-delete-metas.component';
import { Ahorro } from 'src/app/models/ahorro.model';
import { AddUpdtDeleteAhorrosComponent } from '../ahorros/add-updt-delete-ahorros/add-updt-delete-ahorros.component';

@Component({
  selector: 'app-metas',
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class MetasPage implements OnInit {

  // @section: services
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  // @endsection

  // @section: variables
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  metas: Meta[] = [];
  valorMeta: number = 0;

  // @endsection


  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.metas$.subscribe(metas => {
      this.metas = metas;
    });

    this.obtenerMetasUsuario();
  }



  // @section: crud metas y ahorros
  async crearMeta(meta?: Meta) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteMetasComponent,
      componentProps: {
        meta: meta
      }
    });

    await modal.present();
  }

  async crearAhorro(ahorro?: Ahorro) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteAhorrosComponent,
      componentProps: {
        ahorro: ahorro
      }
    });

    await modal.present();
  }

  // @endsection


  async confirmarDelete(meta) {

    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar Meta',
      message: '¿Estás seguro que deseas eliminarla?',
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
            this.eliminarMeta(meta)
          }
        }
      ]
    });

    await alert.present();
  }


  async eliminarMeta(meta: Meta) {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.usuario.uid}/metas/${meta.id}`;


    this.firebaseSVC.deleteDocument(path).then(async res => {


      this.utilsSVC.presentToast({
        message: 'Meta eliminada con exito',
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

    this.obtenerMetasUsuario()
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



  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

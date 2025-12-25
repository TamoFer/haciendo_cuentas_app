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
import { CotizacionService } from 'src/app/services/cotizacion.service';

@Component({
  selector: 'app-metas',
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class MetasPage implements OnInit {

  // @section: services
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  cotizacionSVC = inject(CotizacionService);

  // @endsection

  // @section: variables
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  metas: Meta[] = [];
  valorMeta: number = 0;
  dolarOficial: number = 0;


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

    this.cotizacionSVC.obtenerCotizacionDolarOficial().subscribe({
      next: (cotizacion) => {
        this.dolarOficial = cotizacion.venta;
      },
      error: (err) => {
        console.error('Error al obtener la cotización del dólar:', err);
      }
    })
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

  // @endsection


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

  sumarAhorradoMeta(meta: Meta) {
    let valorAhorrado = 0;
    let monedaMeta = meta.moneda;
    for (let ahorro of meta.ahorrado) {
      if (monedaMeta === 'USD') {
        ahorro.moneda === 'Pesos Argentinos' ? valorAhorrado += this.conversionMetaUSD(Number(ahorro.importe)) : valorAhorrado += Number(ahorro.importe);
      } else {
        ahorro.moneda === 'USD' ? valorAhorrado += this.conversionMetaARS(Number(ahorro.importe)) : valorAhorrado += Number(ahorro.importe);
      }
    }
    this.valorMeta = ((valorAhorrado * 100) / meta.valor) / 100;
    return valorAhorrado;
  }

  conversionMetaUSD(importeARS: number) {
    return importeARS / this.dolarOficial
  }

  conversionMetaARS(importeUSD: number) {
    return importeUSD * this.dolarOficial
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

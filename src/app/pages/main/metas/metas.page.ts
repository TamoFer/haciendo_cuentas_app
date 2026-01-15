import { CommonModule, NgFor } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Meta } from 'src/app/models/metas.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteMetasComponent } from './add-updt-delete-metas/add-updt-delete-metas.component';
import { Ahorro } from 'src/app/models/ahorro.model';
import { CotizacionService } from 'src/app/services/cotizacion.service';
import { combineLatest } from 'rxjs';




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

  valorMeta: number = 0;
  dolarOficial: number = 0;
  loading = true;
  metas: Meta[] = [];
  ahorros: Ahorro[] = [];

  // @endsection


  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    combineLatest([
      this.utilsSVC.metas$,
      this.utilsSVC.ahorros$
    ]).subscribe(([metas, ahorros]) => {

      console.log('METAS:', metas);
      console.log('AHORROS:', ahorros);

      this.metas = metas;
      this.ahorros = ahorros;

      this.metas.forEach(meta => {
        console.log('Meta:', meta.nombre);
        console.log('IDs ahorrados:', meta.ahorrado);

        meta.totalAhorrado = this.sumarAhorradoMeta(meta);

        console.log('Total calculado:', meta.totalAhorrado);
      });

      this.loading = false;

    });
    this.obtenerMetasUsuario();
    this.ObtenerAhorrosUsuario();
  }



  // @section: crud metas 
  async crearMeta(meta?: Meta) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteMetasComponent,
      componentProps: {
        meta: meta
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

  ObtenerAhorrosUsuario() {
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

  sumarAhorradoMeta(meta: Meta) {
    let valorAhorrado = 0;
    let monedaMeta = meta.moneda;

    for (let ahorro of meta.ahorrado) {
      // console.log(typeof (ahorro));
      if (monedaMeta === 'USD') {
        valorAhorrado += this.conversionUSD(this.valorAhorradoMeta(ahorro));
      } else {
        valorAhorrado += this.valorAhorradoMeta(ahorro);
      }
    }

    this.valorMeta = ((valorAhorrado * 100) / meta.valor) / 100;

    return valorAhorrado;
  }

  valorAhorradoMeta(idAhorro: string) {

    for (let ahorro of this.ahorros) {
      if (ahorro.id === idAhorro) {
        return Number(ahorro.moneda === 'USD' ? this.conversionARS(Number(ahorro.importe)) : ahorro.importe);
      }

    }
    return 0;
  }

  conversionUSD(importeARS: number) {
    return importeARS / this.dolarOficial
  }

  conversionARS(importeUSD: number) {
    return importeUSD * this.dolarOficial
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

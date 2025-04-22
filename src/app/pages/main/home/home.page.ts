import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Gasto } from 'src/app/models/gasto.model';
import { Ingreso } from 'src/app/models/ingreso.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteGastoComponent } from '../gastos/add-updt-delete-gasto/add-updt-delete-gasto.component';
import { AddUpdtDeleteIngresosComponent } from '../ingresos/add-updt-delete-ingresos/add-updt-delete-ingresos.component';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor]

})
export class HomePage implements OnInit {


  //importo servicios
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  //defino variables que uso en html

  nombreUser: string = '';
  saldo_bco: number;
  saldo_efe: number;
  saldo_total: number;

  // condicionales para mostrar info
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarOpciones: boolean = false;

  user(): User {
    return this.utilsSVC.obtenerDatosLS('user')
  }

  gastos: Gasto[] = [];
  ingresos: Ingreso[] = [];

  ngOnInit() {
    if (this.user()) {
      this.nombreUser = this.user().name;
      this.saldo_bco = this.user().saldo_banco;
      this.saldo_efe = this.user().saldo_efectivo;
      this.saldo_total = this.saldo_bco + this.saldo_efe;
      this.usuarioLogeado = true;
    }
  }

  ionViewWillEnter() {
    this.obtenerGastos();
    this.obtenerIngresos();
  }

  obtenerGastos() {
    let path = `users/${this.user().uid}/gastos`;

    let sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: any) => {
        console.log(res);
        this.gastos = res;
        sub.unsubscribe();

      }
    })
  }

  obtenerIngresos() {
    let path = `users/${this.user().uid}/ingresos`;

    let sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: any) => {
        console.log(res);
        this.ingresos = res;
        sub.unsubscribe();

      }
    })
  }




  async confirmarSignOut() {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas desloguearte?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.signOut();
          }
        }
      ]
    });

    await alert.present();
  }

  signOut() {
    this.firebaseSVC.signOut();
  }

  //agregar gastos
  agregarGastos() {
    this.utilsSVC.presentModal({
      component: AddUpdtDeleteGastoComponent
    })
  }

  //agergas ingresos
  agregarIngresos() {
    this.utilsSVC.presentModal({
      component: AddUpdtDeleteIngresosComponent
    })
  }

}

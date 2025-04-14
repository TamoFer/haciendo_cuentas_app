import { NgIf } from '@angular/common';
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

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf]

})
export class HomePage implements OnInit {


  //importo servicios
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  //defino variables que uso en html

  nombreUser: string = '';
  saldo_bco: number;
  saldo_efe: number;
  ingresos: Ingreso[] = [];
  gastos: Gasto[] = [];
  saldo_total: number;

  // condicionales para mostrar info
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarOpciones: boolean = false;



  ngOnInit() {
    const usuario = this.utilsSVC.obtenerDatosLS('user');
    if (usuario) {
      this.nombreUser = usuario.name;
      this.saldo_bco = usuario.saldo_banco;
      this.saldo_efe = usuario.saldo_efectivo;
      this.gastos = usuario.gastos;
      this.ingresos = usuario.ingresos;
      this.saldo_total = this.saldo_bco + this.saldo_efe;
      this.usuarioLogeado = true;
    }
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

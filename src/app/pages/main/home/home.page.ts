import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteGastoComponent } from '../gastos/add-updt-delete-gasto/add-updt-delete-gasto.component';
import { AddUpdtDeleteIngresosComponent } from '../ingresos/add-updt-delete-ingresos/add-updt-delete-ingresos.component';
import { User } from 'src/app/models/user.model';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor]

})
export class HomePage implements OnInit, OnDestroy {


  //importo servicios
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  // ruta = inject(Router);


  //defino variables que uso en html
  nombreUser: string = '';
  saldo_bco: number;
  saldo_efe: number;
  saldo_total: number;
  hora: Date = new Date();

  // private rutaSubscripcion!: Subscription;


  // condicionales para mostrar info
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarMovimientos: boolean;
  movimientosCuenta: Movimiento[] = [];

  private opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  fechaFormateada = new Intl.DateTimeFormat('es-AR', this.opciones).format(this.hora);


  user(): User {
    return this.utilsSVC.obtenerDatosLS('user')
  }


  ngOnInit() {
    this.obtenerDatosUsuario(this.user());
    // this.rutaSubscripcion = this.ruta.events
    //   .pipe(filter(event => event instanceof NavigationEnd))
    //   .subscribe(() => {
    //     this.user()
    //     this.obtenerDatosUsuario(this.user())
    //   })

  }

  obtenerDatosUsuario(user) {

    this.nombreUser = user.name;
    this.saldo_bco = user?.saldo_banco || 0;
    this.saldo_efe = user?.saldo_efectivo || 0;
    this.saldo_total = this.saldo_bco + this.saldo_efe;
    this.usuarioLogeado = true;
    this.obtenerMovimientosCuenta();
  }

  obtenerMovimientosCuenta() {
    let path = `users/${this.user().uid}/movimientos`;

    let sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: any) => {
        this.movimientosCuenta = res;
        this.ordenarMovimientosPorFecha();
        sub.unsubscribe();
      }
    })
  }

  ordenarMovimientosPorFecha() {
    this.movimientosCuenta = this.movimientosCuenta.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
    const path = `users/${this.user().uid}`;
    const data = {
      ... this.user(),
      saldo_banco: this.saldo_bco,
      saldo_efectivo: this.saldo_efe
    };

    this.firebaseSVC.setDocument(path, data).then(() => {
      this.movimientosCuenta = [];
      this.firebaseSVC.signOut();
    })


  }

  //agregar gastos o actualizar 
  agregarGastos(gasto?: Movimiento) {
    this.utilsSVC.presentModal({
      component: AddUpdtDeleteGastoComponent,
      componentProps: (gasto)
    })
  }

  //agregar ingresos o actualizar 
  agregarIngresos(ingreso?: Movimiento) {
    this.utilsSVC.presentModal({
      component: AddUpdtDeleteIngresosComponent,
      componentProps: (ingreso)
    })
  }


  ngOnDestroy() {
    // this.rutaSubscripcion?.unsubscribe();
  }
}


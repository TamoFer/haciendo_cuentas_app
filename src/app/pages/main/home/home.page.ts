import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteGastoComponent } from '../gastos/add-updt-delete-gasto/add-updt-delete-gasto.component';
import { AddUpdtDeleteIngresosComponent } from '../ingresos/add-updt-delete-ingresos/add-updt-delete-ingresos.component';
import { User } from 'src/app/models/user.model';
import { Subscription } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';

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
  dataSyncService = inject(RefreshService);

  //defino variables que uso en html
  nombreUser: string = '';
  saldo_bco: number;
  saldo_efe: number;
  saldo_total: number;
  hora: Date = new Date();
  private refreshSub: Subscription;



  // condicionales para mostrar info
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarMovimientos: boolean;
  movimientosCuenta: Movimiento[];

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
    if (this.user()) {
      this.obtenerDatosUsuario(this.user())
    }
    this.chequearCambios();

  }

  ngOnDestroy() {
    this.refreshSub.unsubscribe();
  }

  chequearCambios() {
    this.refreshSub = this.dataSyncService.actualizarDatos.subscribe((refrescar) => {
      if (refrescar) {
        this.obtenerMovimientosCuenta();
        this.obtenerDatosUsuario(this.user());
      }
    })
  }

  obtenerDatosUsuario(user) {
    this.nombreUser = user.name;
    this.saldo_bco = user?.saldo_banco || 0;
    this.saldo_efe = user?.saldo_efectivo || 0;
    this.saldo_total = this.saldo_bco + this.saldo_efe;
    this.usuarioLogeado = true;
    this.obtenerMovimientosCuenta();
  }

  // obtenerSaldoTotal() {
  //   if (this.saldo_total == 0) {
  //     for (let movimiento of this.movimientosCuenta) {
  //       this.sumarSaldos(movimiento);
  //     }

  //   } else {
  //     const ultimoMov = this.movimientosCuenta[this.movimientosCuenta.length - 1];
  //     this.sumarSaldos(ultimoMov);
  //   }

  //   return this.saldo_total = this.saldo_bco + this.saldo_efe;
  // }

  obtenerMovimientosCuenta() {
    let path = `users/${this.user().uid}/movimientos`;

    let sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: any) => {
        this.movimientosCuenta = res;
        this.ordenarMovimientosPorFecha();
        // this.obtenerSaldoTotal();
        sub.unsubscribe();
      }
    })
  }

  // sumarSaldos(movimiento) {
  //   if (movimiento.tipo == 'Efectivo') {
  //     if (movimiento.genero == 'ingreso') {
  //       this.saldo_efe += Number(movimiento.importe)
  //     } else {
  //       this.saldo_efe -= Number(movimiento.importe)
  //     }
  //   } else {
  //     if (movimiento.genero == 'ingreso') {
  //       this.saldo_bco += Number(movimiento.importe)
  //     } else {
  //       this.saldo_bco -= Number(movimiento.importe)
  //     }
  //   }
  // }

  ordenarMovimientosPorFecha() {
    this.movimientosCuenta.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
      this.firebaseSVC.signOut();
    })

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


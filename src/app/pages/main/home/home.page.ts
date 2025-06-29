import { CommonModule, NgFor, NgIf } from '@angular/common';
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
import { Subscription } from 'rxjs';
import { CambioDivisaComponent } from '../intercambio/cambio-divisa/cambio-divisa.component';
import { IdleTimeoutService } from 'src/app/services/idle-timeout.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule]

})
export class HomePage implements OnInit, OnDestroy {


  //importo servicios
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);


  //defino variables que uso en html
  nombreUser: string = '';
  saldo_bco: number;
  saldo_efe: number;
  saldo_total: number;
  hora: Date = new Date();



  // condicionales para mostrar info
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  user: User;
  subscripcionUser: Subscription;
  mostrarSaldos: boolean;

  private opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  fechaFormateada = new Intl.DateTimeFormat('es-AR', this.opciones).format(this.hora);

  constructor(private idleService: IdleTimeoutService) {
    this.idleService.startWatching();
  }

  ngOnInit() {
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.obtenerDatosUsuario(user);
      }
    });

    this.utilsSVC.movimientos$.subscribe(movs => {
      this.movimientosCuenta = movs.sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    });

    // Cargar movimientos una vez (al iniciar)
    this.obtenerMovimientosCuenta();
  }

  obtenerDatosUsuario(user: User) {

    this.nombreUser = user.name;
    this.saldo_bco = user?.saldo_banco || 0;
    this.saldo_efe = user?.saldo_efectivo || 0;
    this.saldo_total = this.saldo_bco + this.saldo_efe;
    this.usuarioLogeado = true;
    this.obtenerMovimientosCuenta();
  }


  obtenerMovimientosCuenta() {
    const path = `users/${this.user.uid}/movimientos`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => {
        this.utilsSVC.setMovimientos(res);
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
      }
    });
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
    const path = `users/${this.user.uid}`;
    const data = {
      ... this.user,
      saldo_banco: this.saldo_bco,
      saldo_efectivo: this.saldo_efe,
      censurar_montos: this.mostrarSaldos
    };

    this.firebaseSVC.setDocument(path, data).then(() => {
      this.movimientosCuenta = [];
      this.firebaseSVC.signOut();
    })


  }

  //agregar gastos o actualizar 
  async agregarGastos(movimiento?: Movimiento) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteGastoComponent,
      componentProps: {
        gasto: movimiento // ✅ PASA el movimiento si existe
      }
    });

    await modal.present();
  }

  //agregar ingresos o actualizar 
  async agregarIngresos(movimiento?: Movimiento) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteIngresosComponent,
      componentProps: {
        ingreso: movimiento // Aunque sea ingreso, lo tratás como Movimiento
      }
    });

    await modal.present();
  }

  //alerta notificacion
  async infoMovimiento(movimiento) {
    if (movimiento.genero == 'gasto') {
      const alert = await this.utilsSVC.alertasCtrl.create({

        header: movimiento.rubro,
        subHeader: 'Costo $ ' + movimiento.importe,
        message: movimiento.detalle,
        buttons: ['OK']
      })
      await alert.present();
    } else {
      const alert = await this.utilsSVC.alertasCtrl.create({

        header: movimiento.detalle,
        subHeader: movimiento.tipo,
        message: 'Ganancia: $' + movimiento.importe,
        buttons: ['OK'],
      })
      await alert.present();
    }
  }


  async confirmarDelete(movimiento) {

    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar Movimiento',
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
            this.eliminarMovimiento(movimiento)
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarMovimiento(movimiento: Movimiento) {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos/${movimiento.id}`;

    this.restarSaldos(movimiento);

    this.firebaseSVC.deleteDocument(path).then(async res => {


      this.utilsSVC.presentToast({
        message: 'Movimiento eliminado con exito',
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

    this.obtenerMovimientosCuenta()

  }

  restarSaldos(movimiento) {
    const path = `users/${this.user.uid}`;

    let nuevoSaldoBco = this.user.saldo_banco;
    let nuevoSaldoEfe = this.user.saldo_efectivo;

    if (movimiento.genero === 'gasto') {
      movimiento.tipo === 'Efectivo' ?
        nuevoSaldoEfe += Number(movimiento.importe) :
        nuevoSaldoBco += Number(movimiento.importe);
    } else {
      movimiento.tipo === 'Efectivo' ?
        nuevoSaldoEfe -= Number(movimiento.importe) :
        nuevoSaldoBco -= Number(movimiento.importe);
    }

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })

    this.utilsSVC.setUser({
      ... this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })
  }

  async intercambioSaldos() {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: CambioDivisaComponent
    })
    await modal.present();

  }

  ngOnDestroy() {
    this.subscripcionUser?.unsubscribe();
  }



}


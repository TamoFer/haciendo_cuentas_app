import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteIngresosComponent } from './add-updt-delete-ingresos/add-updt-delete-ingresos.component';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  styleUrls: ['./ingresos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class IngresosPage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  usuario = this.utilsSVC.obtenerDatosLS('user');
  totalGastos: number = 0;

  dias = [7, 15, 30];

  busquedaPorFechas: boolean = false;
  busquedaPorRubro: boolean = false;
  busquedaPorDetalle: boolean = false;
  busquedaPorDias: boolean = false;


  formulario = new FormGroup({
    desde: new FormControl(null),
    hasta: new FormControl(null),
    rubro: new FormControl(null),
    detalle: new FormControl(null, Validators.minLength(1)),
    dias: new FormControl(null)
  });

  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.movimientos$.subscribe(movs => {
      this.movimientosCuenta = movs.sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ) && movs.filter(mov => mov.genero != 'gasto');

    });
    this.obtenerMovimientosCuenta();
  }

  obtenerMovimientosCuenta() {
    const path = `users/${this.usuario.uid}/movimientos`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => {
        this.utilsSVC.setMovimientos(res);
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
      }
    });


  }

  async agregarIngresos(movimiento?: Movimiento) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteIngresosComponent,
      componentProps: {
        ingreso: movimiento // ✅ PASA el movimiento si existe
      }
    });


    await modal.present();
    this.obtenerMovimientosCuenta()
    this.limpiarFiltros()
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


    let path = `users/${this.usuario.uid}/movimientos/${movimiento.id}`;

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
    this.limpiarFiltros()
  }

  restarSaldos(movimiento) {
    const path = `users/${this.usuario.uid}`;

    let nuevoSaldoBco = this.usuario.saldo_banco;

    let nuevoSaldoEfe = this.usuario.saldo_efectivo;


    if (movimiento.genero === 'gasto') {
      movimiento.tipo === 'Efectivo' ?
        nuevoSaldoEfe += Number(movimiento.importe.replace(/\./g, '').replace(',', '.')) :
        nuevoSaldoBco += Number(movimiento.importe.replace(/\./g, '').replace(',', '.'));
    } else {
      movimiento.tipo === 'Efectivo' ?
        nuevoSaldoEfe -= Number(movimiento.importe.replace(/\./g, '').replace(',', '.')) :
        nuevoSaldoBco -= Number(movimiento.importe.replace(/\./g, '').replace(',', '.'));
    }

    this.firebaseSVC.updateDocument(path, {
      ...this.usuario,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })

    this.utilsSVC.setUser({
      ... this.usuario,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })
  }


  filtrarDatos(formulario: FormGroup) {
    const { rubro, detalle, dias, desde, hasta } = formulario.value;
    let total = 0;
    const hoy = new Date();
    let fechaLimite: Date | null = null;

    if (dias != null) {
      fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() - dias);
    }

    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      const fechaMov = new Date(mov.fecha);
      const importe = Number(String(mov.importe).replace(/\./g, '').replace(',', '.'));

      const coincideRubro = rubro ? mov.rubro.toLowerCase() === rubro.toLowerCase() : true;
      const coincideDetalle = detalle ? mov.detalle.toLowerCase().includes(detalle.toLowerCase()) : true;
      const coincideDias = fechaLimite ? fechaMov >= fechaLimite : true;
      const coincideFechas = (desde && hasta) ? (fechaMov >= new Date(desde) && fechaMov <= new Date(hasta)) : true;

      const pasaFiltros = coincideRubro && coincideDetalle && coincideDias && coincideFechas;

      if (pasaFiltros) {
        total += importe;
      }

      return pasaFiltros;
    });

    this.totalGastos = total;
  }


  iconPorRubro(rubro: string) {
    switch (rubro.toLowerCase()) {
      case 'sueldo':
        return 'receipt-outline';
      case 'venta':
        return 'cash-outline';
      case 'prestamo':
        return 'download-outline';
      case 'apuesta':
        return 'football-outline';
      case 'changa':
        return 'construct-outline';
      case 'saldo':
        return 'wallet-outline';
      default:
        return 'help-outline'
    }

  }



  limpiarFiltros() {
    this.formulario.reset();
    this.movimientosFiltrados = [];
    this.totalGastos = 0;
  }


}

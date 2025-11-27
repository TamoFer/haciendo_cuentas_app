import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteGastoComponent } from './add-updt-delete-gasto/add-updt-delete-gasto.component';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]
})
export class GastosPage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  usuario = this.utilsSVC.obtenerDatosLS('user');
  totalGastos: number = 0;


  dias = [7, 15, 30]


  busquedaPorFecha: boolean = false;
  busquedaPorFechas: boolean = false;
  busquedaPorRubro: boolean = false;
  busquedaPorDetalle: boolean = false;
  busquedaPorDias: boolean = false;


  formulario = new FormGroup({
    hoy: new FormControl(null),
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
      ) && movs.filter(mov => mov.genero != 'ingreso');

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



  filtrarDatos(formulario: FormGroup) {
    const { rubro, detalle, dias, desde, hasta, hoy } = formulario.value;
    let total = 0;

    const today = new Date();
    let fechaLimite: Date | null = null;
    let fechaHoy: Date | null = null;

    if (dias != null) {
      fechaLimite = new Date();
      fechaLimite.setDate(today.getDate() - dias);
    }


    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      const fechaMov = new Date(mov.fecha);
      const importe = Number(String(mov.importe).replace(/\./g, '').replace(',', '.'));

      const fechaMovStr = fechaMov.toISOString().split('T')[0];
      const hoyStr = today.toISOString().split('T')[0];


      const coincideHoy = hoy ? (fechaMovStr === hoyStr) : true;
      const coincideRubro = rubro ? mov.rubro.toLowerCase() === rubro.toLowerCase() : true;
      const coincideDetalle = detalle ? mov.detalle.toLowerCase().includes(detalle.toLowerCase()) : true;
      const coincideDias = fechaLimite ? fechaMov >= fechaLimite : true;
      const coincideFechas = (desde && hasta) ? (fechaMov >= new Date(desde) && fechaMov <= new Date(hasta)) : true;

      const pasaFiltros = coincideRubro && coincideDetalle && coincideDias && coincideFechas && coincideHoy;

      if (pasaFiltros) {
        total += importe;
      }

      return pasaFiltros;
    });


    if (total === 0) {
      this.sinGastos();

    }
    this.totalGastos = total;
  }

  async sinGastos() {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Sin gastos',
      message: 'No hay gastos que coincidan con los filtros seleccionados',
      buttons: [

        {
          text: 'OK',
          handler: () => {
            this.cerrarModal();
          }
        }
      ],
    });

    await alert.present();
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

  async agregarGastos(movimiento?: Movimiento) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteGastoComponent,
      componentProps: {
        gasto: movimiento // ✅ PASA el movimiento si existe
      }
    });

    await modal.present();
    this.obtenerMovimientosCuenta()
    this.limpiarFiltros()
  }

  restarSaldos(movimiento) {
    const path = `users/${this.usuario.uid}`;

    let nuevoSaldoBco = this.usuario.saldo_banco;
    console.log(nuevoSaldoBco);

    let nuevoSaldoEfe = this.usuario.saldo_efectivo;
    console.log(nuevoSaldoEfe);


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

  limpiarFiltros() {
    this.formulario.reset();
    this.movimientosFiltrados = [];
    this.totalGastos = 0;
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}

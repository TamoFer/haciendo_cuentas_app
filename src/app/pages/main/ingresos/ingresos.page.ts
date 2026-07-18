import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteIngresosComponent } from './add-updt-delete-ingresos/add-updt-delete-ingresos.component';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  styleUrls: ['./ingresos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, ReactiveFormsModule]

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

  rubros = [
    { nombre: 'Sueldo', icono: 'receipt-outline' },
    { nombre: 'Venta', icono: 'cash-outline' },
    { nombre: 'Préstamo', icono: 'download-outline' },
    { nombre: 'Apuesta', icono: 'football-outline' },
    { nombre: 'Changa', icono: 'construct-outline' },
    { nombre: 'Saldo', icono: 'wallet-outline' },
    { nombre: 'Ahorro', icono: 'piggy-bank-outline' },
    { nombre: 'Otros', icono: 'pricetag-outline' },
  ];

  // Tipo de filtro rápido de fecha seleccionado
  // 'hoy' | '7' | '15' | '30' | 'rango' | 'todo' | null
  quickFilter: string | null = '15';
  limiteAuto15 = false;

  formulario = new FormGroup({
    hoy: new FormControl(null),
    desde: new FormControl(null),
    hasta: new FormControl(null),
    rubro: new FormControl(null),
    detalle: new FormControl(null, Validators.minLength(1)),
    dias: new FormControl('16')
  });

  constructor() { }

  seleccionarQuick(tipo: string) {
    this.quickFilter = this.quickFilter === tipo ? null : tipo;

    this.formulario.patchValue({
      hoy: null,
      desde: null,
      hasta: null,
      dias: null
    });

    switch (this.quickFilter) {
      case 'hoy':
        this.formulario.patchValue({ hoy: true });
        break;
      case '7':
        this.formulario.patchValue({ dias: '8' });
        break;
      case '15':
        this.formulario.patchValue({ dias: '16' });
        break;
      case '30':
        this.formulario.patchValue({ dias: '31' });
        break;
      case 'rango':
        break;
      case 'todo':
        break;
    }

    this.actualizarLimiteAuto();
  }

  toggleRubro(valor: string) {
    const current = this.formulario.controls.rubro.value;
    this.formulario.controls.rubro.setValue(current === valor ? null : valor);
    this.actualizarLimiteAuto();
  }

  actualizarLimiteAuto() {
    const { rubro, detalle, hoy, dias, desde, hasta } = this.formulario.value;
    const hayFiltroFecha = !!hoy || dias != null || (desde && hasta);
    const hayRubroODetalle = !!rubro || (!!detalle && detalle.length > 0);
    this.limiteAuto15 = !hayFiltroFecha && hayRubroODetalle;
  }


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
      cssClass: 'modal-fullscreen',
      componentProps: {
        ingreso: movimiento,
        rubros: this.rubros
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
    const { rubro, detalle, dias, desde, hasta, hoy } = formulario.value;
    let total = 0;

    const today = new Date();
    let fechaLimite: Date | null = null;

    const hayFiltroFecha = !!hoy || dias != null || (desde && hasta);

    // REGLA: si NO se eligió filtro de fecha, pero hay rubro o detalle,
    // limitar automáticamente a los últimos 15 días.
    if (!hayFiltroFecha && (rubro || detalle)) {
      fechaLimite = new Date();
      fechaLimite.setDate(today.getDate() - 15);
    } else if (dias != null) {
      fechaLimite = new Date();
      fechaLimite.setDate(today.getDate() - dias);
    }

    this.actualizarLimiteAuto();

    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      const fechaMov = this.parseLocalDate(mov.fecha);
      const importe = Number(String(mov.importe).replace(/\./g, '').replace(',', '.'));

      const fechaMovStr = this.toLocalDateStr(fechaMov);
      const hoyStr = this.toLocalDateStr(today);


      const coincideHoy = hoy ? (fechaMovStr === hoyStr) : true;
      const coincideRubro = rubro ? mov.rubro.toLowerCase() === rubro.toLowerCase() : true;
      const coincideDetalle = detalle ? mov.detalle.toLowerCase().includes(detalle.toLowerCase()) : true;
      const coincideDias = fechaLimite ? fechaMov >= fechaLimite : true;
      const coincideFechas = (desde && hasta) ? (fechaMov >= this.parseLocalDate(desde) && fechaMov <= this.parseLocalDate(hasta)) : true;

      const pasaFiltros = coincideRubro && coincideDetalle && coincideDias && coincideFechas && coincideHoy;

      if (pasaFiltros) {
        total += importe;
      }

      return pasaFiltros;
    });


    if (total === 0) {
      this.sinIngresos();

    }
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

  async sinIngresos() {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Sin ingresos',
      message: 'No hay ingresos que coincidan con los filtros seleccionados',
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

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

  toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  parseLocalDate(fecha: any): Date {
    if (typeof fecha === 'string') {
      return new Date(fecha + 'T00:00:00');
    }
    if (fecha && typeof fecha.toDate === 'function') {
      return fecha.toDate();
    }
    return new Date(fecha);
  }

  limpiarFiltros() {
    this.formulario.reset();
    this.quickFilter = '15';
    this.formulario.patchValue({ dias: '16' });
    this.limiteAuto15 = false;
    this.movimientosFiltrados = [];
    this.totalGastos = 0;
  }


}

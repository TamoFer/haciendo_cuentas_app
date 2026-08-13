import { CommonModule, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AddUpdtDeleteGastoComponent } from './add-updt-delete-gasto/add-updt-delete-gasto.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, ReactiveFormsModule, NgTemplateOutlet]
})
export class GastosPage implements OnInit, OnDestroy {

  @Input() ocultarHeader = false;
  @Input() ocultarFooter = false;
  @Input() embebido = false;
  get contentTag(): string { return this.embebido ? 'div' : 'ion-content'; }

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  usuario = this.utilsSVC.obtenerDatosLS('user');
  totalGastos: number = 0;

  private destroy$ = new Subject<void>();

  rubros = [
    { nombre: 'Compras', icono: 'cart-outline' },
    { nombre: 'Supermercado', icono: 'basket-outline' },
    { nombre: 'Servicios', icono: 'flash-outline' },
    { nombre: 'Transporte', icono: 'car-outline' },
    { nombre: 'Alquiler', icono: 'home-outline' },
    { nombre: 'Salud', icono: 'medkit-outline' },
    { nombre: 'Educación', icono: 'school-outline' },
    { nombre: 'Ocio', icono: 'film-outline' },
    { nombre: 'Restaurantes', icono: 'restaurant-outline' },
    { nombre: 'Regalos', icono: 'gift-outline' },
    { nombre: 'Deudas', icono: 'card-outline' },
    { nombre: 'Suscripciones', icono: 'repeat-outline' },
    { nombre: 'A medias', icono: 'people-outline' },
    { nombre: 'Otros', icono: 'pricetag-outline' },
  ];


  // Tipo de filtro rápido de fecha seleccionado
  // 'hoy' | '7' | '15' | '30' | 'rango' | 'todo' | null
  quickFilter: string | null = '15';

  // Mostrar advertencia de límite 15 días automático
  limiteAuto15 = false;

  // Rubros colapsado por defecto
  rubrosExpanded = false;

  formulario = new FormGroup({
    hoy: new FormControl(null),
    desde: new FormControl(null),
    hasta: new FormControl(null),
    rubro: new FormControl(null),
    detalle: new FormControl(null, Validators.minLength(1)),
    dias: new FormControl('16')
  });


  constructor() { }

  get rubroSelIcon(): string {
    const sel = this.rubros.find(r => r.nombre === this.formulario.controls.rubro.value);
    return sel ? sel.icono : 'pricetag-outline';
  }

  importeFmt(mov: Movimiento): string {
    return this.utilsSVC.formatARS(mov.importe);
  }

  toggleRubros() {
    this.rubrosExpanded = !this.rubrosExpanded;
  }

  /** Selecciona un chip rápido de fecha */
  seleccionarQuick(tipo: string) {
    this.quickFilter = this.quickFilter === tipo ? null : tipo;

    // Limpia controles de fecha
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
        // el usuario completa desde/hasta
        break;
      case 'todo':
        // sin filtro de fecha explícito
        break;
    }

    this.actualizarLimiteAuto();
  }

  /** Toggle de rubro tipo chip */
  toggleRubro(valor: string) {
    const current = this.formulario.controls.rubro.value;
    this.formulario.controls.rubro.setValue(current === valor ? null : valor);
    this.actualizarLimiteAuto();
  }

  /** Detecta si se debe aplicar el límite automático de 15 días */
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

    this.utilsSVC.movimientos$.pipe(takeUntil(this.destroy$)).subscribe(movs => {
      this.movimientosCuenta = movs.filter(mov => mov.genero !== 'ingreso');
    });

    if (!this.utilsSVC.getMovimientosActuales().length) {
      this.obtenerMovimientosCuenta();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  obtenerMovimientosCuenta() {
    const path = `users/${this.usuario.uid}/movimientos`;

    this.firebaseSVC.getCollectionData(path).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: Movimiento[]) => {
        this.utilsSVC.setMovimientos(res);
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
      }
    });


  }



  aplicarFiltros() {
    const { rubro, detalle, dias, desde, hasta, hoy } = this.formulario.value;
    let total = 0;

    const today = new Date();
    let fechaLimite: Date | null = null;

    // ¿Hay algún filtro de fecha activo?
    const hayFiltroFecha = !!hoy || dias != null || (desde && hasta);

    // REGLA: si NO se eligió filtro de fecha, pero hay rubro o detalle,
    // limitar automáticamente a los últimos 15 días.
    if (!hayFiltroFecha && (rubro || detalle)) {
      fechaLimite = new Date();
      fechaLimite.setDate(today.getDate() - 15);
    } else if (dias != null) {
      fechaLimite = new Date();
      fechaLimite.setDate(today.getDate() - Number(dias));
    }

    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      const fechaMov = this.parseLocalDate(mov.fecha);
      const importe = this.utilsSVC.parseARS(mov.importe);

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

    this.totalGastos = total;
  }

  filtrarDatos() {
    this.actualizarLimiteAuto();
    this.aplicarFiltros();

    if (this.totalGastos === 0) {
      this.sinGastos();
    }
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

      this.utilsSVC.eliminarMovimiento(movimiento.id);

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

    this.limpiarFiltros()
  }

  async agregarGastos(movimiento?: Movimiento) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AddUpdtDeleteGastoComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        gasto: movimiento,
        rubros: this.rubros
      }
    });

    await modal.present();
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
        nuevoSaldoEfe += this.utilsSVC.parseARS(movimiento.importe) :
        nuevoSaldoBco += this.utilsSVC.parseARS(movimiento.importe);
    } else {
      movimiento.tipo === 'Efectivo' ?
        nuevoSaldoEfe -= this.utilsSVC.parseARS(movimiento.importe) :
        nuevoSaldoBco -= this.utilsSVC.parseARS(movimiento.importe);
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
    this.quickFilter = '15';
    this.formulario.patchValue({ dias: '16', rubro: null });
    this.rubrosExpanded = false;
    this.limiteAuto15 = false;
    this.movimientosFiltrados = [];
    this.totalGastos = 0;
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
}

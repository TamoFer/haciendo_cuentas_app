import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador, GastoConCuota, ProyeccionMes, ProyeccionConfig } from 'src/app/models/gasto-simulador.model';
import { AgregarGastoComponent } from './agregar-gasto/agregar-gasto.component';
import { VerGastoComponent } from './ver-gasto/ver-gasto.component';
import { UtilsService } from 'src/app/services/utils.service';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoElementPredicate } from '@maskito/core';

@Component({
  selector: 'app-simulador-financiero',
  templateUrl: './simulador-financiero.page.html',
  styleUrls: ['./simulador-financiero.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, FooterComponent, IngresoDatosComponent, MaskitoDirective]
})
export class SimuladorFinancieroPage implements OnInit {

  simuladorSvc = inject(SimuladorService);
  utilsSvc = inject(UtilsService);

  ingresoMensual: number = 0;
  ingresoMensualControl = new FormControl(null);
  fechaCierreControl = new FormControl(null);
  fechaCierre: string = '';
  mesesProyeccion: number = 6;
  proyecciones: ProyeccionMes[] = [];
  configId: string = 'config_principal';

  gastosFijos: GastoSimulador[] = [];
  gastosTemporales: GastoSimulador[] = [];

  mostrarDetalle: boolean = false;
  mesDetalle?: ProyeccionMes;
  expandirFijos: boolean = true;
  expandirTemporales: boolean = true;

  categoriasFijas: string[] = ['Servicios', 'Alquiler', 'Supermercado', 'Transporte', 'Seguros', 'Suscripciones', 'Otros'];
  categoriasTemporales: string[] = ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otro'];

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  async ngOnInit() {
    await this.cargarConfig();
    await this.cargarGastos();
  }

  async cargarConfig() {
    const config = await this.simuladorSvc.obtenerConfig();
    if (config) {
      this.ingresoMensualControl.setValue(config.ingresoMensual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      this.mesesProyeccion = config.mesesProyeccion;
      if (config.fechaCierre) {
        this.fechaCierreControl.setValue(config.fechaCierre);
      }
    }
  }

  async guardarConfig() {
    const ingresoValor = this.ingresoMensualControl.value ? Number(this.ingresoMensualControl.value.replace(/\./g, '').replace(',', '.')) : 0;
    if (ingresoValor <= 0) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un monto para guardar',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const config: ProyeccionConfig = {
      id: this.configId,
      ingresoMensual: ingresoValor,
      mesesProyeccion: this.mesesProyeccion,
      fechaCierre: this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null,
      fechaActualizacion: new Date()
    };

    await this.simuladorSvc.guardarConfig(config);
    this.utilsSvc.presentToast({
      message: 'Configuración guardada',
      duration: 2000,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
    this.calcularProyeccion();
  }

  async actualizarConfig() {
    const config = await this.simuladorSvc.obtenerConfig();
    if (!config) {
      this.guardarConfig();
      return;
    }

    const ingresoValor = this.ingresoMensualControl.value ? Number(this.ingresoMensualControl.value.replace(/\./g, '').replace(',', '.')) : 0;

    const configActualizada: ProyeccionConfig = {
      ...config,
      ingresoMensual: ingresoValor,
      mesesProyeccion: this.mesesProyeccion,
      fechaCierre: this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null,
      fechaActualizacion: new Date()
    };

    await this.simuladorSvc.guardarConfig(configActualizada);
    this.utilsSvc.presentToast({
      message: 'Configuración actualizada',
      duration: 2000,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
    this.calcularProyeccion();
  }

  async borrarConfig() {
    await this.simuladorSvc.eliminarConfig();
    this.ingresoMensualControl.setValue(null);
    this.fechaCierreControl.setValue(null);
    this.mesesProyeccion = 6;
    this.proyecciones = [];
    this.utilsSvc.presentToast({
      message: 'Configuración eliminada',
      duration: 2000,
      color: 'medium',
      position: 'middle',
      icon: 'trash-outline'
    });
  }

  async cargarGastos(forceRecalculate: boolean = false) {
    await this.simuladorSvc.eliminarGastosVencidos();

    const gastos = await this.simuladorSvc.obtenerGastos();
    this.gastosFijos = gastos.filter(g => g.tipo === 'fijo').sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.gastosTemporales = gastos.filter(g => g.tipo === 'temporal').sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (forceRecalculate || this.ingresoMensualControl.value) {
      this.calcularProyeccion();
    }
  }

  calcularProyeccion() {
    const ingresoValor = this.ingresoMensualControl.value ? Number(this.ingresoMensualControl.value.replace(/\./g, '').replace(',', '.')) : 0;
    const fechaCierre = this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null;

    if (ingresoValor <= 0) {
      this.proyecciones = [];
      return;
    }

    const offsetMeses = this.simuladorSvc.getOffsetMeses();
    this.proyecciones = this.simuladorSvc.calcularProyeccion(
      ingresoValor,
      this.mesesProyeccion,
      this.gastosFijos,
      this.gastosTemporales,
      fechaCierre,
      offsetMeses
    );
  }

  onFechaCierreChange(event: any) {
    if (event.detail.value) {
      const fecha = new Date(event.detail.value);
      this.fechaCierreControl.setValue(fecha.getDate());
    } else {
      this.fechaCierreControl.setValue(null);
    }
    this.calcularProyeccion();
  }

  async abrirModalGasto(tipo: 'fijo' | 'temporal', event?: Event, gasto?: GastoSimulador) {
    if (event) {
      event.stopPropagation();
    }

    const modal = await this.utilsSvc.modalsCtrl.create({
      component: AgregarGastoComponent,
      componentProps: {
        tipo,
        categorias: tipo === 'fijo' ? this.categoriasFijas : this.categoriasTemporales,
        gasto: gasto || null
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      if (data.eliminar) {
        if (tipo === 'fijo') {
          await this.eliminarGastoFijo(data.id);
        } else {
          await this.eliminarGastoTemporal(data.id);
        }
      } else if (data.id && data.existente) {
        await this.simuladorSvc.actualizarGasto(data.id, data);
        await this.cargarGastos(true);
      } else {
        await this.simuladorSvc.guardarGasto(data);
        await this.cargarGastos(true);
      }
    }
  }

  async eliminarGastoFijo(id: string) {
    await this.simuladorSvc.eliminarGasto(id);
    await this.cargarGastos();
  }

  async eliminarGastoTemporal(id: string) {
    await this.simuladorSvc.eliminarGasto(id);
    await this.cargarGastos();
  }

  toggleFijos() {
    this.expandirFijos = !this.expandirFijos;
  }

  toggleTemporales() {
    this.expandirTemporales = !this.expandirTemporales;
  }

  toggleDetalle(proyeccion: ProyeccionMes) {
    if (this.mesDetalle === proyeccion) {
      this.mesDetalle = undefined;
      this.mostrarDetalle = false;
    } else {
      this.mesDetalle = proyeccion;
      this.mostrarDetalle = true;
    }
  }

  formatearMonto(monto: number): string {
    return this.simuladorSvc.formatearMonto(monto);
  }

  getTotalGastosFijos(): number {
    return this.gastosFijos.reduce((sum, g) => sum + g.importe, 0);
  }

  getTotalGastosTemporales(): number {
    return this.gastosTemporales.reduce((sum, g) => sum + g.importe, 0);
  }

  async confirmarEliminarTodosFijos() {
    if (this.gastosFijos.length === 0) return;

    const alert = await this.utilsSvc.alertasCtrl.create({
      header: 'Eliminar todos los gastos fijos',
      message: `¿Estás seguro que deseas eliminar los ${this.gastosFijos.length} gastos fijos?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarTodosFijos()
        }
      ]
    });
    await alert.present();
  }

  async confirmarEliminarGasto(gasto: GastoSimulador, tipo: 'fijo' | 'temporal') {
    const alert = await this.utilsSvc.alertasCtrl.create({
      header: 'Eliminar gasto',
      message: `¿Estás seguro que deseas eliminar "${gasto.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.simuladorSvc.eliminarGasto(gasto.id);
            await this.cargarGastos(true);
            this.utilsSvc.presentToast({
              message: 'Gasto eliminado',
              duration: 2000,
              color: 'success',
              position: 'middle',
              icon: 'checkmark-circle-outline'
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarTodosFijos() {
    for (const gasto of this.gastosFijos) {
      await this.simuladorSvc.eliminarGasto(gasto.id);
    }
    await this.cargarGastos(true);
    this.utilsSvc.presentToast({
      message: 'Gastos fijos eliminados',
      duration: 2000,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
  }

  async confirmarEliminarTodosTemporales() {
    if (this.gastosTemporales.length === 0) return;

    const alert = await this.utilsSvc.alertasCtrl.create({
      header: 'Eliminar todos los gastos proyectados',
      message: `¿Estás seguro que deseas eliminar los ${this.gastosTemporales.length} gastos proyectados?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarTodosTemporales()
        }
      ]
    });
    await alert.present();
  }

  async eliminarTodosTemporales() {
    for (const gasto of this.gastosTemporales) {
      await this.simuladorSvc.eliminarGasto(gasto.id);
    }
    await this.cargarGastos(true);
    this.utilsSvc.presentToast({
      message: 'Gastos proyectados eliminados',
      duration: 2000,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
  }

  async verInfoGasto(gasto: GastoSimulador) {
    const fechaCierre = this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null;
    const modal = await this.utilsSvc.modalsCtrl.create({
      component: VerGastoComponent,
      componentProps: {
        gasto,
        fechaCierre,
        cerrar: () => this.utilsSvc.dismissModal()
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      if (data.eliminar) {
        await this.simuladorSvc.eliminarGasto(data.id);
        await this.cargarGastos(true);
        this.utilsSvc.presentToast({
          message: 'Gasto eliminado',
          duration: 2000,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        });
      } else if (data.id && data.existente) {
        await this.simuladorSvc.actualizarGasto(data.id, data);
        await this.cargarGastos(true);
        this.utilsSvc.presentToast({
          message: 'Gasto actualizado',
          duration: 2000,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        });
      }
    }
  }

  getMesInicioEfectivo(fechaInicio: Date, fechaCierre: number | null): Date {
    if (!fechaCierre || fechaCierre <= 0) {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    }

    const diaCreacion = fechaInicio.getDate();
    if (diaCreacion <= fechaCierre) {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 1);
    } else {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 2, 1);
    }
  }

  getInfoCuota(gasto: GastoSimulador, fechaMes: Date): string | null {
    if (!gasto.cantidadCuotas || gasto.cantidadCuotas <= 0) {
      return null;
    }

    const fechaInicio = this.simuladorSvc.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return null;

    const fechaCierre = this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null;
    const mesInicioEfectivo = this.getMesInicioEfectivo(fechaInicio, fechaCierre);
    const mesProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

    const mesesDiff = (mesProyeccion.getFullYear() - mesInicioEfectivo.getFullYear()) * 12 +
      (mesProyeccion.getMonth() - mesInicioEfectivo.getMonth());

    if (mesesDiff < 0) return null;

    const cuotaActual = Math.min(mesesDiff + 1, gasto.cantidadCuotas);
    const cuotasRestantes = gasto.cantidadCuotas - cuotaActual;

    if (cuotasRestantes === 0) {
      return `Última cuota`;
    }

    return `${cuotaActual}/${gasto.cantidadCuotas} (${cuotasRestantes} restantes)`;
  }

  getNumeroCuotaActual(gasto: GastoSimulador, fechaMes: Date): number | null {
    if (!gasto.cantidadCuotas || gasto.cantidadCuotas <= 0) {
      return null;
    }

    const fechaInicio = this.simuladorSvc.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return null;

    const fechaCierre = this.fechaCierreControl.value ? Number(this.fechaCierreControl.value) : null;
    const mesInicioEfectivo = this.getMesInicioEfectivo(fechaInicio, fechaCierre);
    const mesProyeccion = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);

    const mesesDiff = (mesProyeccion.getFullYear() - mesInicioEfectivo.getFullYear()) * 12 +
      (mesProyeccion.getMonth() - mesInicioEfectivo.getMonth());

    if (mesesDiff < 0) return null;

    return Math.min(mesesDiff + 1, gasto.cantidadCuotas);
  }

  getTotalCuotas(gasto: GastoSimulador): number | null {
    return gasto.cantidadCuotas && gasto.cantidadCuotas > 0 ? gasto.cantidadCuotas : null;
  }

  tieneCuotas(gasto: GastoSimulador): boolean {
    return gasto.cantidadCuotas !== null && gasto.cantidadCuotas !== undefined && gasto.cantidadCuotas > 0;
  }

  getIconoPorCategoria(categoria: string): string {
    const cat = categoria.toLowerCase();
    if (cat === 'alquiler') return 'home-outline';
    if (cat === 'servicios') return 'flash-outline';
    if (cat === 'supermercado') return 'cart-outline';
    if (cat === 'transporte') return 'car-outline';
    if (cat === 'seguros') return 'shield-checkmark-outline';
    if (cat === 'suscripciones') return 'repeat-outline';
    if (cat === 'prestamo') return 'cash-outline';
    if (cat === 'cuota') return 'layers-outline';
    if (cat === 'compra') return 'bag-outline';
    if (cat === 'deuda') return 'card-outline';
    return 'pricetag-outline';
  }
}

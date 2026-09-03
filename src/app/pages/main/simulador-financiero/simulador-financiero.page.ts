import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador, GastoConCuota, ProyeccionMes, ProyeccionConfig } from 'src/app/models/gasto-simulador.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { AgregarGastoComponent } from './agregar-gasto/agregar-gasto.component';
import { VerGastoComponent } from './ver-gasto/ver-gasto.component';
import { UtilsService } from 'src/app/services/utils.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoElementPredicate } from '@maskito/core';
import { Tarjeta } from 'src/app/models/tarjeta.model';

interface TarjetaGrupoSim {
  tarjeta: Tarjeta;
  gastos: GastoSimulador[];
  total: number;
  expandido: boolean;
}
@Component({
  selector: 'app-simulador-financiero',
  templateUrl: './simulador-financiero.page.html',
  styleUrls: ['./simulador-financiero.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, FooterComponent, MaskitoDirective]
})
export class SimuladorFinancieroPage implements OnInit {

  simuladorSvc = inject(SimuladorService);
  utilsSvc = inject(UtilsService);
  firebaseSVC = inject(FirebaseService);

  ingresoMensual: number = 0;
  ingresoMensualControl = new FormControl(null);
  mesesProyeccion: number = 6;
  proyecciones: ProyeccionMes[] = [];
  configId: string = 'config_principal';

  gastosFijos: GastoSimulador[] = [];
  gastosTemporales: GastoSimulador[] = [];
  tarjetas: Tarjeta[] = [];
<<<<<<< HEAD
  tarjetasGrupos: TarjetaGrupoSim[] = [];
  cuotificadosSinTarjeta: GastoSimulador[] = [];
=======
>>>>>>> 3129338 (modificando_teclado-numerico)

  mostrarDetalle: boolean = false;
  mesDetalle?: ProyeccionMes;
  expandirFijos: boolean = true;
  expandirTemporales: boolean = true;

  categoriasFijas: string[] = ['Servicios', 'Alquiler', 'Supermercado', 'Transporte', 'Seguros', 'Suscripciones', 'Otros'];
  categoriasTemporales: string[] = ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otros'];

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  async ngOnInit() {
    this.cargarEstadoSecciones();
    this.utilsSvc.tarjetas$.subscribe(tarjetas => {
      this.tarjetas = tarjetas || [];
      this.calcularProyeccion();
    });
    this.simuladorSvc.obtenerTarjetas();
    await this.cargarConfig();
    await this.cargarFechaCierreFromFavorita();
    await this.cargarGastos();
  }

  cargarEstadoSecciones() {
    const estado = localStorage.getItem('simuladorEstadoSecciones');
    if (estado) {
      try {
        const parsed = JSON.parse(estado);
        this.expandirFijos = parsed.expandirFijos ?? true;
        this.expandirTemporales = parsed.expandirTemporales ?? true;
      } catch {
        this.expandirFijos = true;
        this.expandirTemporales = true;
      }
    }
  }

  guardarEstadoSecciones() {
    localStorage.setItem('simuladorEstadoSecciones', JSON.stringify({
      expandirFijos: this.expandirFijos,
      expandirTemporales: this.expandirTemporales
    }));
  }

  async handleRefresh(event: any) {
    await this.cargarConfig();
    await this.cargarGastos(true);
    event.target.complete();
  }

  async cargarConfig() {
    const config = await this.simuladorSvc.obtenerConfig();
    if (config) {
      this.ingresoMensualControl.setValue(config.ingresoMensual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      this.mesesProyeccion = config.mesesProyeccion;
<<<<<<< HEAD
      if (config.fechaCierre) {
        this.fechaCierreControl.setValue(config.fechaCierre);
        this.actualizarFechaCierreStr(config.fechaCierre);
      }
=======
>>>>>>> 3129338 (modificando_teclado-numerico)
    }
  }

  async cargarFechaCierreFromFavorita() {
    const usuario = this.utilsSvc.obtenerDatosLS('user');
    if (!usuario) return;
    const path = `users/${usuario.uid}/tarjetas`;
    this.firebaseSVC.getCollectionData(path).subscribe((tarjetas: Tarjeta[]) => {
      const fav = tarjetas.find(t => t.favorita);
      if (fav && fav.fecha_cierre) {
        let dia: number;
        const f = fav.fecha_cierre;
        if (f && typeof (f as any).toDate === 'function') {
          dia = (f as any).toDate().getDate();
        } else if (f instanceof Date) {
          dia = f.getDate();
        } else {
          const str = String(f as any);
          const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
          dia = d.getDate();
        }
        if (dia) {
          this.fechaCierreControl.setValue(dia);
          this.actualizarFechaCierreStr(dia);
          this.calcularProyeccion();
        }
      }
    });
  }

  actualizarFechaCierreStr(dia: number) {
    const now = new Date();
    const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diaReal = Math.min(dia, ultimoDia);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(diaReal).padStart(2, '0');
    this.fechaCierre = `${year}-${month}-${dayStr}`;
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
      fechaCierre: null,
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
      fechaCierre: null,
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

    await this.cargarTarjetasYCargarGrupos();

    if (forceRecalculate || this.ingresoMensualControl.value) {
      this.calcularProyeccion();
    }
  }

  private async cargarTarjetasYCargarGrupos() {
    const usuario = this.utilsSvc.obtenerDatosLS('user');
    if (!usuario) return;

    const tarjetas = await new Promise<Tarjeta[]>((resolve) => {
      this.firebaseSVC.getCollectionData(`users/${usuario.uid}/tarjetas`).subscribe({
        next: (data: Tarjeta[]) => resolve(data || []),
        error: () => resolve([])
      });
    });

    this.tarjetas = tarjetas;
    this.utilsSvc.setTarjetas(tarjetas);
    this.actualizarGruposCuotificados();
  }

  private actualizarGruposCuotificados() {
    const conTarjeta = this.gastosTemporales.filter(g => g.tarjetaId);
    this.cuotificadosSinTarjeta = this.gastosTemporales.filter(g => !g.tarjetaId);

    this.tarjetasGrupos = this.tarjetas
      .map(t => {
        const gastos = conTarjeta.filter(g => g.tarjetaId === t.id);
        return {
          tarjeta: t,
          gastos,
          total: gastos.reduce((s, g) => s + g.importe, 0),
          expandido: gastos.length > 0
        };
      })
      .filter(g => g.gastos.length > 0);
  }

  toggleGrupoTarjeta(grupo: TarjetaGrupoSim) {
    grupo.expandido = !grupo.expandido;
  }

  getColorBanco(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return '#c8102e';
      case 'bbva': return '#0033a0';
      case 'galicia': return '#ff6f00';
      default: return '#4a5568';
    }
  }

  getColorBancoGradient(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return 'linear-gradient(135deg, #ec1c24 0%, #c8102e 50%, #a00d23 100%)';
      case 'bbva': return 'linear-gradient(135deg, #0066ff 0%, #0033a0 50%, #00267d 100%)';
      case 'galicia': return 'linear-gradient(135deg, #ff8f00 0%, #ff6f00 50%, #e65100 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4a5568 50%, #374151 100%)';
    }
  }

  calcularProyeccion() {
    const ingresoValor = this.ingresoMensualControl.value ? Number(this.ingresoMensualControl.value.replace(/\./g, '').replace(',', '.')) : 0;

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
      g => this.getDiaCierreTarjeta(g),
      offsetMeses
    );
  }

  async abrirModalGasto(tipo: 'fijo' | 'temporal', event?: Event, gasto?: GastoSimulador) {
    if (event) {
      event.stopPropagation();
    }

    const modal = await this.utilsSvc.modalsCtrl.create({
      component: AgregarGastoComponent,
      cssClass: 'modal-fullscreen',
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
    this.guardarEstadoSecciones();
  }

  toggleTemporales() {
    this.expandirTemporales = !this.expandirTemporales;
    this.guardarEstadoSecciones();
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

  getSaldoDisponible(): number {
    const ingresoValor = this.ingresoMensualControl.value
      ? Number(this.ingresoMensualControl.value.replace(/\./g, '').replace(',', '.'))
      : 0;
    return ingresoValor - this.getTotalFijosMesVigente() - this.getTotalFuturosMesVigente();
  }

  private getProyeccionMesVigente(): ProyeccionMes | null {
    return this.simuladorSvc.calcularProyeccion(0, 1, this.gastosFijos, this.gastosTemporales, () => null, 0)[0] ?? null;
  }

  getDiaCierreTarjeta(gasto: GastoSimulador): number | null {
    if (!gasto.tarjetaId) return null;
    const tarjeta = this.tarjetas.find(t => t.id === gasto.tarjetaId);
    if (!tarjeta?.fecha_cierre) return null;
    const fc: any = tarjeta.fecha_cierre;
    if (typeof fc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fc)) {
      return Number(fc.slice(8, 10));
    }
    const d = this.simuladorSvc.safeParseDate(fc);
    return d ? d.getDate() : null;
  }

  getTotalFijosMesVigente(): number {
    return this.getProyeccionMesVigente()?.totalGastosFijos ?? 0;
  }

  getTotalFuturosMesVigente(): number {
    return this.getProyeccionMesVigente()?.totalGastosProyectados ?? 0;
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
    const modal = await this.utilsSvc.modalsCtrl.create({
      component: VerGastoComponent,
      componentProps: {
        gasto,
        fechaCierre: this.getDiaCierreTarjeta(gasto),
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

    const fechaCierre = this.getDiaCierreTarjeta(gasto);
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

    const fechaCierre = this.getDiaCierreTarjeta(gasto);
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

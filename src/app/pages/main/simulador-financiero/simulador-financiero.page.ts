import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador, ProyeccionMes } from 'src/app/models/gasto-simulador.model';
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
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, FooterComponent, IngresoDatosComponent, MaskitoDirective, VerGastoComponent]
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

  gastosFijos: GastoSimulador[] = [];
  gastosTemporales: GastoSimulador[] = [];

  mostrarDetalle: boolean = false;
  mesDetalle?: ProyeccionMes;

  categoriasFijas: string[] = ['Servicios', 'Alquiler', 'Supermercado', 'Transporte', 'Seguros', 'Suscripciones', 'Otros'];
  categoriasTemporales: string[] = ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otro'];

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  async ngOnInit() {
    console.log('SimuladorFinancieroPage ngOnInit');
    const user = this.utilsSvc.obtenerDatosLS('user');
    console.log('User from localStorage:', user);
    await this.cargarGastos();
  }

  async cargarGastos(forceRecalculate: boolean = false) {
    console.log('Eliminando gastos vencidos...');
    await this.simuladorSvc.eliminarGastosVencidos();

    console.log('Obteniendo gastos de Firebase...');
    const gastos = await this.simuladorSvc.obtenerGastos();
    console.log('Gastos recibidos:', gastos);
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

    this.proyecciones = this.simuladorSvc.calcularProyeccion(
      ingresoValor,
      this.mesesProyeccion,
      this.gastosFijos,
      this.gastosTemporales,
      fechaCierre
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
    console.log('Modal dismissed with data:', data);

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
        console.log('Calling guardarGasto with:', data);
        await this.simuladorSvc.guardarGasto(data);
        await this.cargarGastos(true);
      }
    } else {
      console.log('No data received from modal');
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

  async verInfoGasto(gasto: GastoSimulador) {
    const modal = await this.utilsSvc.modalsCtrl.create({
      component: VerGastoComponent,
      componentProps: {
        gasto,
        cerrar: () => this.utilsSvc.dismissModal()
      }
    });
    await modal.present();
  }

  getInfoCuota(gasto: GastoSimulador, fechaMes: Date): string | null {
    if (!gasto.cantidadCuotas || gasto.cantidadCuotas <= 0) {
      return null;
    }

    const fechaInicio = this.simuladorSvc.safeParseDate(gasto.fechaInicio);
    if (!fechaInicio) return null;

    const mesesDiff = (fechaMes.getFullYear() - fechaInicio.getFullYear()) * 12 +
                       (fechaMes.getMonth() - fechaInicio.getMonth());

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

    const mesesDiff = (fechaMes.getFullYear() - fechaInicio.getFullYear()) * 12 +
                       (fechaMes.getMonth() - fechaInicio.getMonth());

    if (mesesDiff < 0) return null;

    return Math.min(mesesDiff + 1, gasto.cantidadCuotas);
  }

  getTotalCuotas(gasto: GastoSimulador): number | null {
    return gasto.cantidadCuotas && gasto.cantidadCuotas > 0 ? gasto.cantidadCuotas : null;
  }

  tieneCuotas(gasto: GastoSimulador): boolean {
    return gasto.cantidadCuotas !== null && gasto.cantidadCuotas !== undefined && gasto.cantidadCuotas > 0;
  }
}

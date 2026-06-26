import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoElementPredicate } from '@maskito/core';

@Component({
  selector: 'app-agregar-gasto',
  templateUrl: './agregar-gasto.component.html',
  styleUrls: ['./agregar-gasto.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, IngresoDatosComponent, MaskitoDirective]
})
export class AgregarGastoComponent implements OnInit {

  utilsSvc = inject(UtilsService);
  simuladorSvc = inject(SimuladorService);

  @Input() tipo: 'fijo' | 'temporal' = 'fijo';
  @Input() categorias: string[] = [];
  @Input() gasto: GastoSimulador | null = null;

  nombre: string = '';
  categoria: string = '';
  importeControl = new FormControl(null);
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = '';
  cantidadCuotas: number | null = null;
  detalles: string = '';

  get esEdicion(): boolean {
    return this.gasto !== null;
  }

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  ngOnInit() {
    if (this.gasto) {
      this.nombre = this.gasto.nombre;
      this.categoria = this.gasto.categoria;
      this.importeControl.setValue(this.gasto.importe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      this.fechaInicio = this.gasto.fechaInicio instanceof Date
        ? this.gasto.fechaInicio.toISOString().split('T')[0]
        : new Date(this.gasto.fechaInicio).toISOString().split('T')[0];
      if (this.gasto.fechaFin) {
        this.fechaFin = this.gasto.fechaFin instanceof Date
          ? this.gasto.fechaFin.toISOString().split('T')[0]
          : new Date(this.gasto.fechaFin).toISOString().split('T')[0];
      }
      this.cantidadCuotas = this.gasto.cantidadCuotas || null;
      this.detalles = this.gasto.detalles || '';
    }
  }

  guardar() {
    if (!this.nombre.trim()) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un nombre',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const importeValor = this.importeControl.value ? Number(this.importeControl.value.replace(/\./g, '').replace(',', '.')) : 0;

    if (importeValor <= 0) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un monto válido',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const cuotas = this.cantidadCuotas ? Number(this.cantidadCuotas) : 0;
    let fechaFinDate: Date | null = null;

    if (this.tipo === 'temporal' && this.fechaFin) {
      fechaFinDate = new Date(this.fechaFin);
    } else if (this.tipo === 'temporal' && cuotas > 0) {
      const fecha = new Date(this.fechaInicio);
      fecha.setDate(1);
      fecha.setMonth(fecha.getMonth() + cuotas);
      fechaFinDate = fecha;
    }

    if (this.esEdicion) {
      const gastoActualizado: Partial<GastoSimulador> & { id: string; existente: boolean } = {
        id: this.gasto!.id,
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: Number(importeValor),
        categoria: this.categoria || 'Otros',
        fechaInicio: new Date(this.fechaInicio),
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        existente: true
      };
      console.log('Actualizando gasto:', gastoActualizado);
      this.utilsSvc.dismissModal(gastoActualizado);
    } else {
      const gasto: GastoSimulador = {
        id: this.simuladorSvc.crearId(),
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: Number(importeValor),
        categoria: this.categoria || 'Otros',
        fechaInicio: new Date(this.fechaInicio),
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        fechaCreacion: new Date()
      };
      console.log('Guardando gasto:', gasto);
      this.utilsSvc.dismissModal(gasto);
    }
  }

  eliminar() {
    if (this.esEdicion) {
      this.utilsSvc.dismissModal({ id: this.gasto!.id, eliminar: true });
    }
  }

  cerrar() {
    this.utilsSvc.dismissModal();
  }
}

import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';

@Component({
  selector: 'app-agregar-gasto',
  template: `
    <ion-header>
      <ion-toolbar [color]="esEdicion ? 'primary' : tipo === 'fijo' ? 'primary' : 'warning'">
        <ion-title>
          <ion-icon [name]="esEdicion ? 'create-outline' : tipo === 'fijo' ? 'link-outline' : 'time-outline'"></ion-icon>
          {{ esEdicion ? 'Editar' : 'Nuevo' }} {{ tipo === 'fijo' ? 'Gasto Fijo' : 'Gasto' }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon name="close-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="info-container">
        <ion-card class="info-card">
          <div class="gasto-nombre">
            <ion-icon [name]="esEdicion ? 'create-outline' : tipo === 'fijo' ? 'link-outline' : 'time-outline'"></ion-icon>
            <span>{{ esEdicion ? nombre : (tipo === 'fijo' ? 'Nuevo Gasto Fijo' : 'Nuevo Gasto') }}</span>
          </div>

          <div class="form-row">
            <ion-item>
              <ion-label position="stacked">Nombre</ion-label>
              <ion-input [(ngModel)]="nombre" placeholder="Ej: ALQUILER" class="input-uppercase" type="text"></ion-input>
            </ion-item>
          </div>

          <div class="form-row">
            <ion-item>
              <ion-label position="stacked">Categoría</ion-label>
              <ion-select [(ngModel)]="categoria" interface="popover">
                @for (cat of categorias; track cat) {
                  <ion-select-option [value]="cat">{{ cat }}</ion-select-option>
                }
                <ion-select-option value="Otros">Otros</ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <div class="form-row">
            <ion-item>
              <ion-label position="stacked">Importe ($)</ion-label>
              <ion-input type="number" [(ngModel)]="importe" [value]="importe"></ion-input>
            </ion-item>
          </div>

          <div class="form-row">
            <ion-item>
              <ion-label position="stacked">Fecha inicio</ion-label>
              <ion-input type="date" [(ngModel)]="fechaInicio"></ion-input>
            </ion-item>
          </div>

          @if (tipo === 'temporal') {
            <div class="form-row">
              <ion-item>
                <ion-label position="stacked">Cantidad de cuotas/meses</ion-label>
                <ion-input type="number" [(ngModel)]="cantidadCuotas" placeholder="Ej: 12"></ion-input>
              </ion-item>
            </div>

            @if (cantidadCuotas && cantidadCuotas > 0) {
              <div class="form-row">
                <ion-item>
                  <ion-label position="stacked">Fecha fin (opcional)</ion-label>
                  <ion-input type="date" [(ngModel)]="fechaFin"></ion-input>
                </ion-item>
              </div>
            }
          }

          <div class="form-row">
            <ion-item>
              <ion-label position="stacked">Notas</ion-label>
              <ion-textarea [(ngModel)]="detalles" placeholder="Notas..." rows="3"></ion-textarea>
            </ion-item>
          </div>
        </ion-card>

        <div class="botones-acciones">
          @if (esEdicion) {
            <ion-button expand="block" color="danger" fill="outline" (click)="eliminar()">
              <ion-icon slot="start" name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          }
          <ion-button expand="block" [color]="esEdicion ? 'primary' : tipo === 'fijo' ? 'primary' : 'warning'" (click)="guardar()">
            <ion-icon slot="start" [name]="esEdicion ? 'save-outline' : 'add-outline'"></ion-icon>
            {{ esEdicion ? 'Guardar' : 'Agregar' }}
          </ion-button>
          <ion-button expand="block" color="medium" fill="outline" (click)="cerrar()">
            <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
            Cancelar
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .info-container {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-card {
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      padding: 8px;
      margin: 0;
    }

    .gasto-nombre {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      font-size: 1.2rem;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid var(--ion-color-light);
      margin-bottom: 8px;
      color: var(--ion-color-dark);

      ion-icon {
        font-size: 1.4rem;
      }
    }

    .form-row {
      margin-bottom: 4px;

      ion-item {
        --padding-start: 8px;
        --inner-padding-end: 8px;
        --background: transparent;
        --border-color: var(--ion-color-light);
      }

      ion-label[position="stacked"] {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
      }

      ion-input, ion-select, ion-textarea {
        --padding-start: 8px;
        --padding-end: 8px;
      }
    }

    .input-uppercase {
      text-transform: uppercase;
    }

    .botones-acciones {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;

      ion-button {
        --border-radius: 12px;
      }
    }
  `],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgregarGastoComponent implements OnInit {

  utilsSvc = inject(UtilsService);
  simuladorSvc = inject(SimuladorService);

  @Input() tipo: 'fijo' | 'temporal' = 'fijo';
  @Input() categorias: string[] = [];
  @Input() gasto: GastoSimulador | null = null;

  nombre: string = '';
  categoria: string = '';
  importe: number = 0;
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = '';
  cantidadCuotas: number | null = null;
  detalles: string = '';

  get esEdicion(): boolean {
    return this.gasto !== null;
  }

  ngOnInit() {
    if (this.gasto) {
      this.nombre = this.gasto.nombre;
      this.categoria = this.gasto.categoria;
      this.importe = this.gasto.importe;
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

    if (this.importe <= 0) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un monto válido',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const fechaInicioFinal = this.fechaInicio ? new Date(this.fechaInicio) : new Date();
    const cuotas = this.cantidadCuotas ? Number(this.cantidadCuotas) : 0;
    let fechaFinDate: Date | null = null;

    if (this.tipo === 'temporal' && this.fechaFin) {
      fechaFinDate = new Date(this.fechaFin);
    } else if (this.tipo === 'temporal' && cuotas > 0) {
      const fecha = new Date(fechaInicioFinal);
      fecha.setDate(1);
      fecha.setMonth(fecha.getMonth() + cuotas);
      fechaFinDate = fecha;
    }

    if (this.esEdicion) {
      const gastoActualizado: Partial<GastoSimulador> & { id: string; existente: boolean } = {
        id: this.gasto!.id,
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: Number(this.importe),
        categoria: this.categoria || 'Otros',
        fechaInicio: fechaInicioFinal,
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        existente: true
      };
      this.utilsSvc.dismissModal(gastoActualizado);
    } else {
      const gasto: GastoSimulador = {
        id: this.simuladorSvc.crearId(),
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: Number(this.importe),
        categoria: this.categoria || 'Otros',
        fechaInicio: fechaInicioFinal,
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        fechaCreacion: new Date()
      };
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
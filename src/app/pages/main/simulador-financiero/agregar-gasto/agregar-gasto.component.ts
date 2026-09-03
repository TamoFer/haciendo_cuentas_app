import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoElementPredicate } from '@maskito/core';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-agregar-gasto',
  template: `
    <ion-header class="gasto-header">
      <ion-toolbar [class.toolbar-fijo]="tipo === 'fijo'" [class.toolbar-temporal]="tipo === 'temporal'">
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ esEdicion ? 'Editar' : 'Nuevo' }} {{ tipo === 'fijo' ? 'Fijo' : 'Proyectado' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="gasto-content">
      <div class="form-wrap">

        <!-- Card de campos -->
        <div class="fields-card">

          <!-- Nombre -->
          <div class="field">
            <div class="field-head">
              <span>Nombre</span>
            </div>
            <ion-input [(ngModel)]="nombre" placeholder="EJ: ALQUILER" class="field-input upper" type="text"></ion-input>
          </div>

          <div class="field-divider"></div>

          <!-- Categoría -->
          <div class="field">
            <div class="field-head">
              <span>Categoría</span>
            </div>
            <div class="chips-wrap">
              @for (cat of categorias; track cat) {
                <ion-chip [color]="categoria === cat ? (tipo === 'fijo' ? 'primary' : 'warning') : 'light'"
                  [outline]="categoria !== cat" (click)="categoria = cat" class="cat-chip">
                  {{ cat }}
                </ion-chip>
              }
            </div>
          </div>

          <div class="field-divider"></div>

          <!-- Importe -->
          <div class="field">
            <div class="field-head">
              <span>Importe</span>
            </div>
            <div class="importe-wrap">
              <span class="importe-symbol">$</span>
              <ion-input [formControl]="importeControl" [maskito]="mascara" [maskitoElement]="maskPredicate"
                inputmode="decimal" type="text" placeholder="0,00" class="field-input importe-input"></ion-input>
            </div>
          </div>

          <div class="field-divider"></div>

          <!-- Fecha inicio -->
          <div class="field">
            <div class="field-head">
              <span>Fecha de inicio</span>
            </div>
            <ion-input type="date" [(ngModel)]="fechaInicio" class="field-input"></ion-input>
          </div>

          @if (tipo === 'temporal') {
            <div class="field-divider"></div>

            <!-- Tarjeta asociada -->
            <div class="field">
              <div class="field-head">
                <span>Tarjeta asociada</span>
              </div>
              @if (tarjetas.length > 0) {
                <div class="chips-wrap">
                  @for (t of tarjetas; track t.id) {
                    <ion-chip [color]="tarjetaSeleccionada?.id === t.id ? 'warning' : 'light'"
                      [outline]="tarjetaSeleccionada?.id !== t.id" (click)="seleccionarTarjeta(t)" class="cat-chip">
                      {{ t.banco }} {{ t.tarjeta }} {{ t.digitos }}
                    </ion-chip>
                  }
                </div>
              } @else {
                <div class="no-tarjetas-hint">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <span>No tenés tarjetas cargadas. Creá una en la sección Tarjetas.</span>
                </div>
              }
            </div>

            <div class="field-divider"></div>

            <!-- Cuotas -->
            <div class="field">
              <div class="field-head">
                <span>Cuotas / meses</span>
              </div>
              <ion-input type="text" inputmode="numeric" [(ngModel)]="cantidadCuotas" placeholder="Ej: 12" class="field-input"></ion-input>
            </div>

            @if (cantidadCuotas && cantidadCuotas > 0) {
              <div class="field-divider"></div>
              <div class="field">
                <div class="field-head">
                  <span>Fecha fin (auto)</span>
                </div>
                <ion-input type="date" [(ngModel)]="fechaFin" class="field-input"></ion-input>
              </div>
            }
          }

          <div class="field-divider"></div>

          <!-- Detalles -->
          <div class="field">
            <div class="field-head">
              <span>Notas (opcional)</span>
            </div>
            <ion-textarea [(ngModel)]="detalles" placeholder="Notas..." rows="2" class="field-input"></ion-textarea>
          </div>

        </div>
      </div>
    </ion-content>

    <!-- Acciones fijas abajo -->
    <div class="actions-bar">
      @if (esEdicion) {
        <ion-button fill="clear" color="danger" (click)="eliminar()" class="action-btn">
          <ion-icon slot="start" name="trash-outline"></ion-icon>
          Eliminar
        </ion-button>
      }
      <ion-button fill="clear" color="medium" (click)="cerrar()" class="action-btn">
        <ion-icon slot="start" name="close-outline"></ion-icon>
        Cancelar
      </ion-button>
      <ion-button class="action-btn save-btn" [class.save-fijo]="tipo === 'fijo'" [class.save-temporal]="tipo === 'temporal'"
        (click)="guardar()">
        <ion-icon slot="start" [name]="esEdicion ? 'checkmark-outline' : 'add-outline'"></ion-icon>
        {{ esEdicion ? 'Guardar' : 'Agregar' }}
      </ion-button>
    </div>
  `,
  styles: [`
    .gasto-header {
      ion-toolbar {
        --border-width: 0;
      }
      .toolbar-fijo {
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
        --color: white;
      }
      .toolbar-temporal {
        --background: linear-gradient(135deg, var(--ion-color-warning) 0%, #f57c00 100%);
        --color: white;
      }
      ion-title {
        font-weight: 600;
      }
      ion-icon {
        font-size: 1.4rem;
      }
    }

    .gasto-content {
      --background: var(--ion-color-light);
    }

    .form-wrap {
      max-width: 520px;
      margin: 0 auto;
      padding: 24px 16px 100px;
    }

    .fields-card {
      background: var(--ion-color-white, #fff);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .field {
      padding: 14px 16px;

      .field-head {
        margin-bottom: 8px;

        span {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--ion-color-medium);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
      }

      .field-input {
        --padding-start: 0;
        --padding-end: 0;
        --background: transparent;
        font-size: 1rem;
        color: var(--ion-color-dark);
      }

      .upper {
        text-transform: uppercase;
      }

      .importe-wrap {
        display: flex;
        align-items: center;
        gap: 4px;

        .importe-symbol {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--ion-color-medium);
        }
      }

      .chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .cat-chip {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.12s ease;
          --background: var(--ion-color-light);
          --color: var(--ion-color-dark);

          &:active {
            transform: scale(0.96);
          }
        }
      }

      .no-tarjetas-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(var(--ion-color-warning-rgb), 0.1);
        border-radius: 10px;
        font-size: 0.82rem;
        color: var(--ion-color-dark);

        ion-icon {
          font-size: 1.1rem;
          color: var(--ion-color-warning);
          flex-shrink: 0;
        }
      }
    }

    .field-divider {
      height: 1px;
      background: var(--ion-color-light);
      margin: 0 16px;
    }

    .actions-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      gap: 8px;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid var(--ion-color-light);
      max-width: 100%;

      .action-btn {
        flex: 1;
        --border-radius: 12px;
        font-weight: 600;
      }

      .save-btn {
        flex: 2;
        --border-radius: 12px;
        font-weight: 700;

        &.save-fijo {
          --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
          --color: white;
        }
        &.save-temporal {
          --background: linear-gradient(135deg, var(--ion-color-warning) 0%, #f57c00 100%);
          --color: white;
        }
      }
    }

    @media (min-width: 1024px) {
      .actions-bar {
        max-width: calc(var(--app-content-max, 1200px) - var(--app-sidenav-width-collapsed, 64px) - 32px);
        margin-left: calc(var(--app-sidenav-width-collapsed, 64px) + 16px);
        border-radius: 16px 16px 0 0;
      }
    }
  `],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, MaskitoDirective]
})
export class AgregarGastoComponent implements OnInit {

  utilsSvc = inject(UtilsService);
  simuladorSvc = inject(SimuladorService);
  firebaseSVC = inject(FirebaseService);

  @Input() tipo: 'fijo' | 'temporal' = 'fijo';
  @Input() categorias: string[] = [];
  @Input() gasto: GastoSimulador | null = null;
  @Input() tarjetaPreseleccionadaId: string | null = null;
  tarjetas: Tarjeta[] = [];
  tarjetaSeleccionada: Tarjeta | null = null;

  nombre: string = '';
  categoria: string = '';
  importeControl = new FormControl('');
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = '';
  cantidadCuotas: number | null = null;
  detalles: string = '';

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  get esEdicion(): boolean {
    return this.gasto !== null;
  }

  ngOnInit() {
    this.utilsSvc.tarjetas$.subscribe(tarjetas => {
      this.tarjetas = tarjetas || [];
      if (this.gasto?.tarjetaId) {
        this.tarjetaSeleccionada = this.tarjetas.find(t => t.id === this.gasto!.tarjetaId) || null;
      } else if (this.tarjetaPreseleccionadaId && this.tipo === 'temporal') {
        this.tarjetaSeleccionada = this.tarjetas.find(t => t.id === this.tarjetaPreseleccionadaId) || null;
      }
    });
    this.obtenerTarjetas();

    if (this.gasto) {
      this.nombre = this.gasto.nombre;
      this.categoria = this.gasto.categoria;
      this.importeControl.setValue(
        this.gasto.importe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
      this.fechaInicio = this.toDateStr(this.gasto.fechaInicio);
      if (this.gasto.fechaFin) {
        this.fechaFin = this.toDateStr(this.gasto.fechaFin);
      }
      this.cantidadCuotas = this.gasto.cantidadCuotas || null;
      this.detalles = this.gasto.detalles || '';
    }
  }

  obtenerTarjetas() {
    const usuario = this.utilsSvc.obtenerDatosLS('user');
    if (!usuario) return;
    const path = `users/${usuario.uid}/tarjetas`;
    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => {
        this.utilsSvc.setTarjetas(res);
      },
      error: err => console.error('Error obteniendo tarjetas', err)
    });
  }

  seleccionarTarjeta(t: Tarjeta) {
    this.tarjetaSeleccionada = t;
  }

  private toDateStr(value: any): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (value && typeof value.toDate === 'function') return value.toDate().toISOString().split('T')[0];
    if (value && value.seconds) return new Date(value.seconds * 1000).toISOString().split('T')[0];
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
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

    if (this.tipo === 'temporal' && !this.tarjetaSeleccionada) {
      this.utilsSvc.presentToast({
        message: 'Seleccioná una tarjeta para el consumo cuotificado',
        duration: 2500,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const importeStr = this.importeControl.value ? String(this.importeControl.value).replace(/\./g, '').replace(',', '.') : '0';
    const importeNum = Number(importeStr);

    if (importeNum <= 0) {
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

    const tarjetaData = this.tarjetaSeleccionada ? {
      tarjetaId: this.tarjetaSeleccionada.id,
      tarjetaNombre: `${this.tarjetaSeleccionada.banco} ${this.tarjetaSeleccionada.tarjeta} ${this.tarjetaSeleccionada.digitos}`
    } : {};

    if (this.esEdicion) {
      const gastoActualizado: Partial<GastoSimulador> & { id: string; existente: boolean } = {
        id: this.gasto!.id,
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: importeNum,
        categoria: this.categoria || 'Otros',
        fechaInicio: fechaInicioFinal,
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        ...tarjetaData,
        existente: true
      };
      this.utilsSvc.dismissModal(gastoActualizado);
    } else {
      const gasto: GastoSimulador = {
        id: this.simuladorSvc.crearId(),
        nombre: this.nombre.trim().toUpperCase(),
        tipo: this.tipo,
        importe: importeNum,
        categoria: this.categoria || 'Otros',
        fechaInicio: fechaInicioFinal,
        fechaFin: fechaFinDate,
        cantidadCuotas: cuotas > 0 ? cuotas : null,
        detalles: this.detalles.trim() || null,
        fechaCreacion: new Date(),
        ...tarjetaData
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
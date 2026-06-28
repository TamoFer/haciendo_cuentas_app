import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';

@Component({
  selector: 'app-ver-gasto',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="information-circle-outline"></ion-icon>
          Detalle del Gasto
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
            <ion-icon name="wallet-outline"></ion-icon>
            <span>{{ gasto.nombre }}</span>
          </div>

          <div class="info-row">
            <div class="info-label">
              <ion-icon name="pricetag-outline"></ion-icon>
              Categoría
            </div>
            <div class="info-value">
              <span class="categoria-badge">{{ gasto.categoria }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <ion-icon name="card-outline"></ion-icon>
              Importe
            </div>
            <div class="info-value monto">{{ formatearMonto(gasto.importe) }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <ion-icon name="repeat-outline"></ion-icon>
              Tipo
            </div>
            <div class="info-value">{{ gasto.tipo === 'fijo' ? 'Gasto Fijo (mensual)' : 'Gasto Proyectado' }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <ion-icon name="calendar-outline"></ion-icon>
              Fecha inicio
            </div>
            <div class="info-value">{{ formatDate(gasto.fechaInicio) }}</div>
          </div>

          @if (gasto.tipo === 'temporal' && gasto.cantidadCuotas) {
            <div class="info-row">
              <div class="info-label">
                <ion-icon name="calendar-outline"></ion-icon>
                Fecha fin
              </div>
              <div class="info-value">{{ getFechaFin() }}</div>
            </div>
          } @else if (gasto.fechaFin) {
            <div class="info-row">
              <div class="info-label">
                <ion-icon name="calendar-outline"></ion-icon>
                Fecha fin
              </div>
              <div class="info-value">{{ formatDate(gasto.fechaFin) }}</div>
            </div>
          }

          @if (gasto.cantidadCuotas) {
            <div class="info-row">
              <div class="info-label">
                <ion-icon name="layers-outline"></ion-icon>
                Cuota
              </div>
              <div class="info-value">{{ getCuotaActual() }}/{{ gasto.cantidadCuotas }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <ion-icon name="time-outline"></ion-icon>
                Duración
              </div>
              <div class="info-value">{{ gasto.cantidadCuotas }} meses</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <ion-icon name="hourglass-outline"></ion-icon>
                Restantes
              </div>
              <div class="info-value">{{ getCuotasRestantes() }}</div>
            </div>
          }

          @if (gasto.detalles) {
            <div class="info-row detalles">
              <div class="info-label">
                <ion-icon name="document-text-outline"></ion-icon>
                Notas
              </div>
              <div class="info-value">{{ gasto.detalles }}</div>
            </div>
          }
        </ion-card>

        <ion-button expand="block" color="medium" (click)="cerrar()">
          <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
          Cerrar
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .info-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card {
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      padding: 8px;
    }

    .gasto-nombre {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--ion-color-primary);
      text-transform: uppercase;
      border-bottom: 1px solid var(--ion-color-light);
      margin-bottom: 8px;

      ion-icon {
        font-size: 1.6rem;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 8px;
      border-bottom: 1px solid var(--ion-color-light);

      &:last-child {
        border-bottom: none;
      }

      &.detalles {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      font-weight: 500;

      ion-icon {
        font-size: 1.1rem;
      }
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--ion-color-dark);

      &.monto {
        font-size: 1.2rem;
        color: var(--ion-color-primary);
        font-weight: 700;
      }
    }

    .categoria-badge {
      background: var(--ion-color-light);
      color: var(--ion-color-dark);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }
  `],
  imports: [IonicModule, CommonModule]
})
export class VerGastoComponent implements OnInit {
  @Input() gasto!: GastoSimulador;
  @Input() cerrar!: () => void;
  @Input() fechaCierre: number | null = null;

  private mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  ngOnInit() {}

  formatearMonto(monto: number): string {
    return '$' + monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  safeParseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    try {
      if (dateValue instanceof Date) return dateValue;
      if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof dateValue === 'number') {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
      }
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000);
      }
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  formatDate(date: Date | string | any): string {
    const d = this.safeParseDate(date);
    if (!d) return 'Fecha inválida';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getFechaFin(): string {
    if (!this.gasto.cantidadCuotas || this.gasto.cantidadCuotas <= 0) {
      return 'N/A';
    }

    const fechaInicio = this.safeParseDate(this.gasto.fechaInicio);
    if (!fechaInicio) return 'Fecha inválida';

    const cuotas = this.gasto.cantidadCuotas;
    const diaCreacion = fechaInicio.getDate();
    let mesesOffset: number;

    if (this.fechaCierre && this.fechaCierre > 0) {
      if (diaCreacion <= this.fechaCierre) {
        mesesOffset = cuotas;
      } else {
        mesesOffset = cuotas + 1;
      }
    } else {
      mesesOffset = cuotas;
    }

    const mesInicio = fechaInicio.getMonth();
    const anioInicio = fechaInicio.getFullYear();

    const mesFin = mesInicio + mesesOffset;
    const anioFin = anioInicio + Math.floor(mesFin / 12);
    const mesAjustado = ((mesFin % 12) + 12) % 12;

    return `${this.mesesNombres[mesAjustado]} ${anioFin}`;
  }

  getMesInicioEfectivo(fechaInicio: Date): Date {
    if (!this.fechaCierre || this.fechaCierre <= 0) {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    }
    if (fechaInicio.getDate() <= this.fechaCierre) {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 1);
    } else {
      return new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 2, 1);
    }
  }

  getCuotaActual(): number {
    if (!this.gasto.cantidadCuotas || this.gasto.cantidadCuotas <= 0) {
      return 0;
    }
    const fechaInicio = this.safeParseDate(this.gasto.fechaInicio);
    if (!fechaInicio) return 0;
    const mesInicioEfectivo = this.getMesInicioEfectivo(fechaInicio);
    const hoy = new Date();
    const mesProyeccion = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesesDiff = (mesProyeccion.getFullYear() - mesInicioEfectivo.getFullYear()) * 12 +
      (mesProyeccion.getMonth() - mesInicioEfectivo.getMonth());
    if (mesesDiff < 0) return 1;
    return Math.min(mesesDiff + 1, this.gasto.cantidadCuotas);
  }

  getCuotasRestantes(): number {
    if (!this.gasto.cantidadCuotas || this.gasto.cantidadCuotas <= 0) {
      return 0;
    }
    return this.gasto.cantidadCuotas - this.getCuotaActual();
  }
}

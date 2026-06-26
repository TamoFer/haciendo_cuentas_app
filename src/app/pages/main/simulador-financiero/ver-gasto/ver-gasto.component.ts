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

          @if (gasto.fechaFin) {
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
                Cuotas
              </div>
              <div class="info-value">{{ gasto.cantidadCuotas }} meses</div>
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

  ngOnInit() {}

  formatearMonto(monto: number): string {
    return '$' + monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}

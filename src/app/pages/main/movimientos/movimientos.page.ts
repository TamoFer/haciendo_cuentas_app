import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GastosPage } from '../gastos/gastos.page';
import { IngresosPage } from '../ingresos/ingresos.page';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';

@Component({
  selector: 'app-movimientos',
  template: `
    <ion-header class="mov-header">
      <ion-toolbar>
        <ion-segment [value]="tab" (ionChange)="cambiarTab($any($event).detail.value)" mode="md">
          <ion-segment-button value="gasto">
            <ion-icon name="trending-down-outline"></ion-icon>
            <ion-label>Gastos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="ingreso">
            <ion-icon name="trending-up-outline"></ion-icon>
            <ion-label>Ingresos</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (tab === 'gasto') {
        <app-gastos [ocultarHeader]="true" [ocultarFooter]="true" [embebido]="true"></app-gastos>
      } @else {
        <app-ingresos [ocultarHeader]="true" [ocultarFooter]="true" [embebido]="true"></app-ingresos>
      }
    </ion-content>

    <app-footer></app-footer>
  `,
  styles: [`
    .mov-header {
      ion-toolbar {
        --background: var(--ion-color-white, #fff);
        --border-width: 0;
      }
      ion-segment {
        --background: var(--ion-color-light);
        border-radius: 12px;
        margin: 8px 12px;
      }
      ion-segment-button {
        --indicator-color: var(--ion-color-primary);
        --color: var(--ion-color-medium);
        --color-checked: var(--ion-color-primary);
        font-weight: 600;
        min-height: 40px;
        ion-icon { font-size: 1.1rem; }
        ion-label { font-size: 0.82rem; }
      }
    }
  `],
  imports: [IonicModule, CommonModule, GastosPage, IngresosPage, FooterComponent]
})
export class MovimientosPage {
  tab: 'gasto' | 'ingreso' = 'gasto';

  cambiarTab(valor: string) {
    this.tab = valor as 'gasto' | 'ingreso';
  }
}
import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { AgregarGastoComponent } from '../simulador-financiero/agregar-gasto/agregar-gasto.component';

@Component({
  selector: 'app-consumos',
  template: `
    <app-header
      [title]="tarjeta.banco + ' ' + tarjeta.tarjeta + ' ' + tarjeta.digitos"
      [isModal]="mostrarBack" (volverAccion)="cerrarModal()">
    </app-header>

    <ion-content>
      <div class="page-container">

        <div class="add-bar">
          <button class="add-btn" (click)="agregarConsumo()">
            <ion-icon name="add-outline"></ion-icon>
            <span>Nuevo consumo cuotificado</span>
          </button>
        </div>

        <div class="consumos-list" *ngIf="consumos.length > 0; else emptyState">
          @for (c of consumos; track c.id) {
            <div class="consumo-item" [class.pagado]="estaPagado(c)">
              <div class="consumo-icon">
                <ion-icon name="time-outline"></ion-icon>
              </div>
              <div class="consumo-body">
                <span class="consumo-nombre">{{ c.nombre }}</span>
                <span class="consumo-meta">
                  <span class="cat-tag" *ngIf="c.categoria">{{ c.categoria }}</span>
                  <span class="cuota-tag">{{ cuotaInfo(c) }}</span>
                </span>
              </div>
              <div class="consumo-actions">
                <span class="consumo-monto">$ {{ c.importe | number:'1.0-0':'es-AR' }}</span>
                <div class="action-btns">
                  <button class="icon-btn" (click)="editarConsumo(c)">
                    <ion-icon name="create-outline"></ion-icon>
                  </button>
                  <button class="icon-btn danger" (click)="confirmarDelete(c)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          }

          <div class="total-bar">
            <span>Total mensual</span>
            <span class="total-monto">{{ totalMensual | currency:'ARS':'symbol':'1.0-0':'es-AR' }}</span>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="empty-state">
            <ion-icon name="receipt-outline"></ion-icon>
            <p>No hay consumos cuotificados asignados a esta tarjeta.</p>
          </div>
        </ng-template>

      </div>
    </ion-content>
  `,
  styles: [`
    .page-container {
      max-width: var(--app-content-max, 1200px);
      margin: 0 auto;
      padding: 16px;
      padding-bottom: 80px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .add-bar { display: flex; }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border: 1.5px solid var(--ion-color-primary);
      border-radius: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      color: var(--ion-color-primary);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      ion-icon { font-size: 1.2rem; }
      &:active { transform: scale(0.97); }
    }

    .consumos-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .consumo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--ion-color-white, #fff);
      border-radius: 12px;
      border: 1px solid var(--app-border, rgba(0,0,0,0.06));
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

      .consumo-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: rgba(var(--ion-color-warning-rgb), 0.12);

        ion-icon { font-size: 1.1rem; color: var(--ion-color-warning); }
      }

      .consumo-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .consumo-nombre {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--ion-color-dark);
        }

        .consumo-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;

          .cat-tag {
            background: rgba(var(--ion-color-primary-rgb), 0.08);
            color: var(--ion-color-primary);
            padding: 1px 8px;
            border-radius: 8px;
            font-size: 0.72rem;
            font-weight: 600;
          }

          .cuota-tag {
            background: rgba(var(--ion-color-warning-rgb), 0.12);
            color: var(--ion-color-warning-shade);
            padding: 1px 8px;
            border-radius: 8px;
            font-size: 0.72rem;
            font-weight: 600;
          }
        }
      }

      .consumo-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;

        .consumo-monto {
          font-size: 1rem;
          font-weight: 700;
          color: var(--ion-color-dark);
          white-space: nowrap;
        }

        .action-btns {
          display: flex;
          gap: 4px;

          .icon-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            border-radius: 6px;

            ion-icon { font-size: 1.15rem; color: var(--ion-color-medium); }
            &:active { transform: scale(0.9); }

            &.danger ion-icon { color: var(--ion-color-danger); }
          }
        }
      }

      &.pagado {
        opacity: 0.55;
        .consumo-nombre { text-decoration: line-through; }
      }
    }

    .total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      margin-top: 8px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      color: white;
      font-size: 0.95rem;
      font-weight: 600;

      .total-monto { font-size: 1.15rem; font-weight: 700; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      background: var(--ion-color-white, #fff);
      border-radius: var(--app-radius-md);

      ion-icon { font-size: 2.6rem; color: var(--ion-color-medium); opacity: 0.4; }
      p { margin: 0; color: var(--ion-color-medium); font-size: 0.9rem; text-align: center; }
    }
  `],
  imports: [IonicModule, HeaderComponent, CommonModule]
})
export class ConsumosComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuario = this.utilsSVC.obtenerDatosLS('user');
  subscripcionUser: Subscription;
  consumosSubscription: Subscription;
  mostrarBack = true;
  consumos: GastoSimulador[] = [];
  totalMensual = 0;
  mesActual = '';

  @Input() tarjeta: Tarjeta;

  ngOnInit() {
    const hoy = new Date();
    this.mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) this.usuario = user;
    });

    this.obtenerConsumosTarjeta();
  }

  obtenerConsumosTarjeta() {
    if (!this.tarjeta || !this.tarjeta.id || !this.usuario) return;
    const path = `users/${this.usuario.uid}/gastosSimulador`;

    this.consumosSubscription = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: GastoSimulador[]) => {
        this.consumos = (res || [])
          .filter(g => g.tipo === 'temporal' && g.tarjetaId === this.tarjeta.id)
          .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
        this.recalcTotal();
      },
      error: err => console.error('Error obteniendo consumos', err)
    });
  }

  recalcTotal() {
    this.totalMensual = this.consumos.reduce((s, c) => s + this.parseImporte(c.importe), 0);
  }

  parseImporte(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    let s = String(value).trim().replace(/\./g, '').replace(',', '.');
    return Number(s) || 0;
  }

  cuotaInfo(g: GastoSimulador): string {
    if (!g.cantidadCuotas || g.cantidadCuotas <= 1) return 'Sin cuotas';
    if (!g.fechaInicio) return '';
    const inicio = new Date(g.fechaInicio);
    const hoy = new Date();
    const cuotaActual = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth()) + 1;
    if (cuotaActual < 1) return `Cuota 0 de ${g.cantidadCuotas} (próxima)`;
    if (cuotaActual > g.cantidadCuotas) return `Cuotas completas`;
    return `Cuota ${cuotaActual} de ${g.cantidadCuotas}`;
  }

  estaPagado(g: GastoSimulador): boolean {
    return !!g.pagado && g.mesPagado === this.mesActual;
  }

  async agregarConsumo() {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AgregarGastoComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        tipo: 'temporal',
        categorias: ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otros'],
        gasto: null,
        tarjetaPreseleccionadaId: this.tarjeta.id
      }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && !data.eliminar) {
      const gastoData = { ...data, tarjetaId: this.tarjeta.id, tarjetaNombre: `${this.tarjeta.banco} ${this.tarjeta.tarjeta} ${this.tarjeta.digitos}` };
      await this.firebaseSVC.addGastoSimulador(this.usuario.uid, gastoData);
      this.utilsSVC.presentToast({
        message: 'Consumo cuotificado agregado',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    }
  }

  async editarConsumo(gasto: GastoSimulador) {
    const modal = await this.utilsSVC.modalsCtrl.create({
      component: AgregarGastoComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        tipo: 'temporal',
        categorias: ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otros'],
        gasto: gasto,
        tarjetaPreseleccionadaId: this.tarjeta.id
      }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.eliminar) {
      await this.firebaseSVC.deleteGastoSimulador(this.usuario.uid, gasto.id);
      this.utilsSVC.presentToast({
        message: 'Consumo eliminado',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    } else if (data?.existente) {
      const { id, existente, ...gastoData } = data;
      await this.firebaseSVC.updateGastoSimulador(this.usuario.uid, id, {
        ...gastoData,
        tarjetaId: this.tarjeta.id,
        tarjetaNombre: `${this.tarjeta.banco} ${this.tarjeta.tarjeta} ${this.tarjeta.digitos}`
      });
      this.utilsSVC.presentToast({
        message: 'Consumo actualizado',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    }
  }

  async confirmarDelete(gasto: GastoSimulador) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Eliminar consumo',
      message: '¿Estás seguro que deseas eliminarlo?',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí', role: 'destructive', handler: () => this.eliminarConsumo(gasto) }
      ]
    });
    await alert.present();
  }

  async eliminarConsumo(gasto: GastoSimulador) {
    const loading = await this.utilsSVC.loading();
    await loading.present();
    await this.firebaseSVC.deleteGastoSimulador(this.usuario.uid, gasto.id);
    loading.dismiss();
    this.utilsSVC.presentToast({
      message: 'Consumo eliminado',
      duration: 1500,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

  ngOnDestroy() {
    if (this.subscripcionUser) this.subscripcionUser.unsubscribe();
    if (this.consumosSubscription) this.consumosSubscription.unsubscribe();
  }
}
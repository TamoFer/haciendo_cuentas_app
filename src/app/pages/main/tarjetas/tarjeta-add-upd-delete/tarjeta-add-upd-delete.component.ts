import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoElementPredicate, MaskitoOptions } from '@maskito/core';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-tarjeta-add-upd-delete',
  template: `
    <ion-header class="edit-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrarModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Editar Tarjeta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="edit-content">
      <form [formGroup]="formulario">
      <div class="form-wrap">
        <div class="fields-card">
          <div class="field">
            <div class="field-head"><span>Banco</span></div>
            <select class="field-select" formControlName="banco">
              <option *ngFor="let b of bancos" [value]="b">{{ b }}</option>
            </select>
          </div>

          <div class="field-divider"></div>

          <div class="field">
            <div class="field-head"><span>Marca</span></div>
            <select class="field-select" formControlName="tarjeta">
              <option *ngFor="let m of marcas" [value]="m">{{ m }}</option>
            </select>
          </div>

          <div class="field-divider"></div>

          <div class="field">
            <div class="field-head"><span>Últimos 4 dígitos</span></div>
            <ion-input class="field-input" [maskito]="cardMask" [maskitoElement]="maskPredicate"
                       placeholder="0000" inputmode="numeric" formControlName="digitos"></ion-input>
          </div>

          <div class="field-divider"></div>

          <div class="field">
            <div class="field-head"><span>Fecha de cierre</span></div>
            <ion-input type="date" class="field-input" formControlName="fecha_cierre"></ion-input>
          </div>
        </div>
      </div>
      </form>
    </ion-content>

    <div class="actions-bar">
      <ion-button fill="clear" color="danger" class="action-btn" (click)="eliminar()">
        <ion-icon slot="start" name="trash-outline"></ion-icon>
        Eliminar
      </ion-button>
      <ion-button fill="clear" color="medium" class="action-btn" (click)="cerrarModal()">
        <ion-icon slot="start" name="close-outline"></ion-icon>
        Cancelar
      </ion-button>
      <ion-button class="action-btn save-btn" [disabled]="!formulario.valid" (click)="editarTarjeta()">
        <ion-icon slot="start" name="checkmark-outline"></ion-icon>
        Guardar
      </ion-button>
    </div>
  `,
  styles: [`
    .edit-header {
      ion-toolbar {
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
        --color: white;
        --border-width: 0;
      }
      ion-title { font-weight: 600; }
      ion-icon { font-size: 1.4rem; }
    }

    .edit-content { --background: var(--ion-color-light); }

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

      .field-select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: var(--ion-color-light);
        font-size: 0.95rem;
        color: var(--ion-color-dark);
        outline: none;
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
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
        --color: white;
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
  imports: [IonicModule, CommonModule, ReactiveFormsModule, MaskitoDirective]
})
export class TarjetaAddUpdDeleteComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuario = this.utilsSVC.obtenerDatosLS('user');
  mostrarBack = true;
  bancos = ['Santander', 'Galicia', 'BBVA', 'Otro'];
  marcas = ['Visa', 'Mastercard', 'American Express'];

  @Input() tarjeta: Tarjeta;

  formulario = new FormGroup({
    id: new FormControl(''),
    digitos: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    fecha_cierre: new FormControl(null, [Validators.required]),
    banco: new FormControl('', [Validators.required]),
    tarjeta: new FormControl('', [Validators.required]),
  });

  readonly cardMask: MaskitoOptions = { mask: [...Array(4).fill(/\d/)] };
  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  ngOnInit() {
    if (this.tarjeta) {
      let fechaStr: string | null = null;
      const f = this.tarjeta.fecha_cierre;
      let fecha: Date;
      if (f && typeof (f as any).toDate === 'function') {
        fecha = (f as any).toDate() as Date;
      } else if (f instanceof Date) {
        fecha = f;
      } else if (typeof f === 'string') {
        fecha = new Date(f + 'T00:00:00');
      } else {
        fecha = new Date(f as any);
      }
      if (fecha && !isNaN(fecha.getTime())) {
        fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      }

      this.formulario.patchValue({
        id: this.tarjeta.id,
        digitos: this.tarjeta.digitos != null ? String(this.tarjeta.digitos) : null,
        fecha_cierre: fechaStr,
        banco: this.tarjeta.banco,
        tarjeta: this.tarjeta.tarjeta,
      });
    }
  }

  async editarTarjeta() {
    if (!this.formulario.valid) return;
    const loading = await this.utilsSVC.loading();
    await loading.present();

    const path = `users/${this.usuario.uid}/tarjetas/${this.tarjeta.id}`;

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(() => {
      this.utilsSVC.dismissModal({ success: true });
      this.utilsSVC.presentToast({
        message: 'Tarjeta actualizada con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    }).catch(error => {
      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => loading.dismiss());
  }

  eliminar() {
    this.utilsSVC.dismissModal({ eliminar: true, id: this.tarjeta.id });
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}
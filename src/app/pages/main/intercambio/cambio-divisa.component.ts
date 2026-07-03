import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Router } from '@angular/router';
import { Cambio } from 'src/app/models/cambio';
import { CotizacionService, DolarCotizacion } from 'src/app/services/cotizacion.service';
import { SwalService } from 'src/app/services/swal.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cambio-divisa',
  templateUrl: './cambio-divisa.component.html',
  styleUrls: ['./cambio-divisa.component.scss'],
  imports: [IonicModule, HeaderComponent, CommonModule, MaskitoDirective, ReactiveFormsModule, FormsModule, NgIf, NgFor]
})
export class CambioDivisaComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  cotizacionSvc = inject(CotizacionService);
  swalSvc = inject(SwalService);

  mostrarBack: boolean = true;
  user = {} as User;
  opcionSeleccionada: string = '';

  cotizaciones: DolarCotizacion[] = [];

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  constructor(private router: Router) { }

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    this.cargarCotizaciones();
  }

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as unknown as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    importeAcambiar: new FormControl(null, [Validators.required, Validators.minLength(1)]),
  });

  cargarCotizaciones() {
    const tipos: ('oficial' | 'blue' | 'bolsa' | 'tarjeta')[] = ['oficial', 'blue', 'bolsa', 'tarjeta'];
    tipos.forEach(tipo => {
      this.cotizacionSvc.obtenerCotizacion(tipo).subscribe({
        next: (res) => this.cotizaciones.push(res),
        error: (err) => console.error(`Error fetching ${tipo}:`, err)
      });
    });
  }

  async submitEtoB() {
    const path = `users/${this.user.uid}`;
    const loading = await this.utilsSVC.loading();

    const saldoEfectivoOriginal = this.user.saldo_efectivo;
    const saldoBancoOriginal = this.user.saldo_banco;
    const importeCambio = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));

    const saldoEfectivoNuevo = Math.abs(saldoEfectivoOriginal - importeCambio);
    const saldoBancoNuevo = Math.abs(saldoBancoOriginal + importeCambio);

    this.utilsSVC.setUser({
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    });

    this.crearCambioRegistro(importeCambio, 'efectivo', 'banco', saldoEfectivoOriginal, saldoEfectivoNuevo, saldoBancoOriginal, saldoBancoNuevo);

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    }).then(async res => {
      await this.utilsSVC.presentToast({
        message: 'Saldos modificados con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.cerrarModal();
      this.router.navigate(['/home']);
    }).catch(error => {
      console.log(error);
      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => {
      loading.dismiss();
    });
  }

  async submitBtoE() {
    const path = `users/${this.user.uid}`;
    const loading = await this.utilsSVC.loading();

    const saldoEfectivoOriginal = this.user.saldo_efectivo;
    const saldoBancoOriginal = this.user.saldo_banco;
    const importeCambio = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));

    const saldoEfectivoNuevo = Math.abs(saldoEfectivoOriginal + importeCambio);
    const saldoBancoNuevo = Math.abs(saldoBancoOriginal - importeCambio);

    this.utilsSVC.setUser({
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    });

    this.crearCambioRegistro(importeCambio, 'banco', 'efectivo', saldoEfectivoOriginal, saldoEfectivoNuevo, saldoBancoOriginal, saldoBancoNuevo);

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    }).then(async res => {
      await this.utilsSVC.presentToast({
        message: 'Saldos modificados con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.cerrarModal();
      this.router.navigate(['/home']);
    }).catch(error => {
      console.log(error);
      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => {
      loading.dismiss();
    });
  }

  async realizarIntercambio() {
    const importeIngresado = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));

    if (this.opcionSeleccionada === 'first') {
      importeIngresado <= this.user.saldo_efectivo
        ? await this.submitEtoB()
        : this.utilsSVC.presentToast({
            header: 'Error',
            message: 'El importe a cambiar supera el saldo disponible.',
            color: 'danger',
            position: 'bottom',
            duration: 1500
          });
    } else {
      importeIngresado <= this.user.saldo_banco
        ? await this.submitBtoE()
        : this.utilsSVC.presentToast({
            header: 'Error',
            message: 'El importe a cambiar supera el saldo disponible.',
            color: 'danger',
            position: 'bottom',
            duration: 1500
          });
    }
  }

  async crearCambioRegistro(importe, desde, hacia, saldoEfectivoAnterior, saldoEfectivoNuevo, saldoBancoAnterior, saldoBancoNuevo) {
    const loading = await this.utilsSVC.loading();
    const path = `users/${this.user.uid}/cambios`;

    const cambio: Cambio = {
      id: String(this.utilsSVC.crearId()),
      importe: importe,
      fecha: new Date().toISOString(),
      desde: desde,
      hacia: hacia,
      saldo_efectivo_anterior: saldoEfectivoAnterior,
      saldo_efectivo_actualizado: saldoEfectivoNuevo,
      saldo_banco_anterior: saldoBancoAnterior,
      saldo_banco_actualizado: saldoBancoNuevo
    };

    this.firebaseSVC.addDocument(path, cambio).then(async res => {
      this.utilsSVC.agregarCambios(cambio);
      this.utilsSVC.dismissModal({ success: true });
    }).catch(error => {
      console.log(error);
    }).finally(() => {
      loading.dismiss();
    });
  }

  async abrirCalculadora(cotizacion: DolarCotizacion) {
    const nombre = cotizacion.nombre;
    const compra = cotizacion.compra;
    const venta = cotizacion.venta;

    let direccion: 'usd-ars' | 'ars-usd' = 'usd-ars';

    await this.swalSvc.fire(
      `Calculadora de ${nombre}`,
      '',
      'info',
      {
        html: `
          <div class="calc-card">
            <div class="calc-title">
              <ion-icon name="trending-up-outline"></ion-icon>
              <span>${nombre}</span>
            </div>

            <div class="calc-row">
              <span class="calc-label">Compra</span>
              <span class="calc-val">$${compra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="calc-row">
              <span class="calc-label">Venta</span>
              <span class="calc-val">$${venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="calc-divider"></div>

            <div class="calc-row">
              <span class="calc-label">Monto</span>
              <div class="calc-input-wrapper">
                <span class="calc-input-prefix">$</span>
                <input id="monto-input" class="calc-input" type="text" inputmode="decimal" placeholder="0,00">
              </div>
            </div>

            <div class="calc-direccion">
              <button id="dir-usd" class="dir-btn dir-active">USD → ARS</button>
              <button id="dir-ars" class="dir-btn">ARS → USD</button>
            </div>

            <button id="calc-convertir" class="calc-convertir-btn">Convertir</button>

            <div id="calc-resultado" class="calc-resultado"></div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: false,
        showCloseButton: true,
        closeButtonHtml: '&times;',
        customClass: {
          popup: 'calc-swal-popup',
          closeButton: 'calc-swal-close'
        },
        didOpen: () => {
          const input = document.getElementById('monto-input') as HTMLInputElement;
          const resultado = document.getElementById('calc-resultado')!;
          const dirUsd = document.getElementById('dir-usd')!;
          const dirArs = document.getElementById('dir-ars')!;

          const seleccionarDireccion = (dir: 'usd-ars' | 'ars-usd') => {
            direccion = dir;
            dirUsd.className = `dir-btn${dir === 'usd-ars' ? ' dir-active' : ''}`;
            dirArs.className = `dir-btn${dir === 'ars-usd' ? ' dir-active' : ''}`;
          };

          dirUsd.addEventListener('click', () => seleccionarDireccion('usd-ars'));
          dirArs.addEventListener('click', () => seleccionarDireccion('ars-usd'));

          const convertir = () => {
            const val = parseFloat(input.value.replace(',', '.'));
            if (isNaN(val) || val <= 0) {
              resultado.innerHTML = '<span class="calc-error">Ingresá un monto válido</span>';
              return;
            }
            if (direccion === 'usd-ars') {
              const r = val * venta;
              resultado.innerHTML = `<span class="calc-exito"><strong>US$ ${val.toLocaleString('es-AR')} → $ ${r.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>`;
            } else {
              const r = val / compra;
              resultado.innerHTML = `<span class="calc-exito"><strong>$ ${val.toLocaleString('es-AR')} → US$ ${r.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>`;
            }
          };

          document.getElementById('calc-convertir')!.addEventListener('click', convertir);
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') convertir(); });
          input.focus();
        }
      }
    );
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}

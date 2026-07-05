import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Cambio } from 'src/app/models/cambio';
import { CotizacionService, DolarCotizacion } from 'src/app/services/cotizacion.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cambio-divisa',
  templateUrl: './cambio-divisa.component.html',
  styleUrls: ['./cambio-divisa.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, RouterLink, CommonModule, MaskitoDirective, ReactiveFormsModule, FormsModule, NgIf, NgFor]
})
export class CambioDivisaComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  cotizacionSvc = inject(CotizacionService);

  usuarioLogeado: boolean = false;
  user = {} as User;
  opcionSeleccionada: string = '';

  cotizaciones: DolarCotizacion[] = [];

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    this.usuarioLogeado = !!this.user;
    this.cargarCotizaciones();
  }

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as unknown as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    importeAcambiar: new FormControl(null, [Validators.required, Validators.min(0.01)]),
  });

  formatearNombre(dolar: DolarCotizacion): string {
    return dolar.nombre.replace('Bolsa', 'MEP');
  }

  cargarCotizaciones() {
    const tipos: ('oficial' | 'blue' | 'bolsa' | 'tarjeta')[] = ['oficial', 'blue', 'bolsa', 'tarjeta'];
    tipos.forEach(tipo => {
      this.cotizacionSvc.obtenerCotizacion(tipo).subscribe({
        next: (res) => this.cotizaciones.push(res),
        error: (err) => console.error(`Error fetching ${tipo}:`, err)
      });
    });
  }

  private async ejecutarIntercambio(
    desde: 'efectivo' | 'banco',
    hacia: 'efectivo' | 'banco'
  ) {
    const path = `users/${this.user.uid}`;
    const loading = await this.utilsSVC.loading();

    const saldoEfectivoOriginal = this.user.saldo_efectivo;
    const saldoBancoOriginal = this.user.saldo_banco;
    const importeCambio = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));

    const descuento = desde === 'efectivo' ? importeCambio : -importeCambio;
    const suma = hacia === 'efectivo' ? importeCambio : -importeCambio;

    const saldoEfectivoNuevo = Math.abs(saldoEfectivoOriginal + (desde === 'efectivo' ? -importeCambio : importeCambio));
    const saldoBancoNuevo = Math.abs(saldoBancoOriginal + (desde === 'banco' ? -importeCambio : importeCambio));

    this.utilsSVC.setUser({
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    });

    this.user.saldo_banco = saldoBancoNuevo;
    this.user.saldo_efectivo = saldoEfectivoNuevo;

    this.crearCambioRegistro(importeCambio, desde, hacia, saldoEfectivoOriginal, saldoEfectivoNuevo, saldoBancoOriginal, saldoBancoNuevo);

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    }).then(async () => {
      this.formulario.reset();
      this.opcionSeleccionada = '';
      await this.utilsSVC.presentToast({
        message: 'Saldos modificados con éxito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
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
      if (importeIngresado <= this.user.saldo_efectivo) {
        await this.ejecutarIntercambio('efectivo', 'banco');
      } else {
        this.utilsSVC.presentToast({
          header: 'Error',
          message: 'El importe a cambiar supera el saldo disponible.',
          color: 'danger',
          position: 'bottom',
          duration: 1500
        });
      }
    } else {
      if (importeIngresado <= this.user.saldo_banco) {
        await this.ejecutarIntercambio('banco', 'efectivo');
      } else {
        this.utilsSVC.presentToast({
          header: 'Error',
          message: 'El importe a cambiar supera el saldo disponible.',
          color: 'danger',
          position: 'bottom',
          duration: 1500
        });
      }
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

    this.firebaseSVC.addDocument(path, cambio).then(async () => {
      this.utilsSVC.agregarCambios(cambio);
    }).catch(error => {
      console.log(error);
    }).finally(() => {
      loading.dismiss();
    });
  }

  volverHome() {
    this.utilsSVC.routerLink('/home');
  }
}

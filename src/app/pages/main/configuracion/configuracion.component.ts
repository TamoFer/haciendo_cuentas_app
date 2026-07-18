import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { MaskitoElementPredicate } from '@maskito/core';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
  imports: [IonicModule, FooterComponent, IngresoDatosComponent, NgIf, ReactiveFormsModule, MaskitoDirective],
  standalone: true
})
export class ConfiguracionComponent {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  mostrarBack: boolean = true;

  user = {} as User;

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.minLength(6)]),
    saldo_efectivo: new FormControl(null, [Validators.required, Validators.min(0)]),
    saldo_banco: new FormControl(null, [Validators.required, Validators.min(0)]),
  });

  ngOnInit() {
    this.user = this.utilsSVC.getUserActual();

    if (this.user) {
      this.formulario.setValue({
        name: this.user.name,
        email: this.user.email,
        password: '',
        saldo_efectivo: this.formatearSaldo(this.user.saldo_efectivo ?? 0),
        saldo_banco: this.formatearSaldo(this.user.saldo_banco ?? 0),
      });
    }
  }

  private formatearSaldo(value: number): string {
    if (value === null || value === undefined || isNaN(value)) value = 0;
    const redondeado = Math.round(value * 100) / 100;
    const partes = redondeado.toFixed(2).split('.');
    const intPart = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let decPart = partes[1] || '';
    decPart = decPart.replace(/0+$/, '');
    return decPart ? `${intPart},${decPart}` : intPart;
  }

  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSVC.loading();
      await loading.present();

      const uid = this.user.uid;
      const valores = this.formulario.value;

      const nombreNuevo = valores.name;
      const emailNuevo = valores.email;
      const passwordNueva = valores.password;
      const saldoEfectivoSinMascara = String(valores.saldo_efectivo).replace(/\./g, '').replace(',', '.');
      const saldoBancoSinMascara = String(valores.saldo_banco).replace(/\./g, '').replace(',', '.');
      const saldoEfectivoNuevo = Math.round(Number(saldoEfectivoSinMascara) * 100) / 100;
      const saldoBancoNuevo = Math.round(Number(saldoBancoSinMascara) * 100) / 100;

      const dataFirestore: any = {
        name: nombreNuevo,
        email: emailNuevo,
        saldo_efectivo: saldoEfectivoNuevo,
        saldo_banco: saldoBancoNuevo,
      };

      const actualizaciones: Promise<any>[] = [];

      if (nombreNuevo && nombreNuevo !== this.user.name) {
        actualizaciones.push(this.firebaseSVC.updateUser(nombreNuevo));
      }

      if (emailNuevo && emailNuevo !== this.user.email) {
        actualizaciones.push(this.firebaseSVC.updateUserEmail(emailNuevo));
      }

      if (passwordNueva && passwordNueva.length >= 6) {
        actualizaciones.push(this.firebaseSVC.updateUserPassword(passwordNueva));
      }

      actualizaciones.push(this.firebaseSVC.updateDocument(`users/${uid}`, dataFirestore));

      Promise.all(actualizaciones).then(() => {

        const userActualizado: User = {
          ...this.user,
          name: nombreNuevo,
          email: emailNuevo,
          saldo_efectivo: saldoEfectivoNuevo,
          saldo_banco: saldoBancoNuevo,
        };

        this.utilsSVC.setUser(userActualizado);

        this.utilsSVC.dismissModal({ success: true });

        this.utilsSVC.presentToast({
          message: 'Configuración actualizada con éxito',
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
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}
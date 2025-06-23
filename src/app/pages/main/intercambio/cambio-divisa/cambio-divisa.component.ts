import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-cambio-divisa',
  templateUrl: './cambio-divisa.component.html',
  styleUrls: ['./cambio-divisa.component.scss'],
  imports: [IonicModule, HeaderComponent, CommonModule, MaskitoDirective, ReactiveFormsModule, FooterComponent, FormsModule]
})
export class CambioDivisaComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  mostrarBack: boolean = true;
  user = {} as User;
  opcionSeleccionada: string = "";

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });


  constructor(
    private router: Router

  ) { }


  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');

  }

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    importeAcambiar: new FormControl(null, [Validators.required, Validators.minLength(1)]),
  });

  async submitEtoB() {
    const path = `users/${this.user.uid}`;
    const loading = await this.utilsSVC.loading();


    const saldoEfectivoOriginal = this.user.saldo_efectivo;

    const saldoBancoOriginal = this.user.saldo_banco;

    const importeCambio = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));


    const saldoEfectivoNuevo = Math.abs(saldoEfectivoOriginal - importeCambio);

    const saldoBancoNuevo = Math.abs(saldoBancoOriginal + importeCambio);


    this.utilsSVC.setUser({
      ... this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    })


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
      this.cerrarModal()
      this.router.navigate(['/home']); // ✅ Navegación DESPUÉS del toast
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


    const saldoEfectivoOriginal = (this.user.saldo_efectivo);
    const saldoBancoOriginal = this.user.saldo_banco;

    const importeCambio = Number(this.formulario.value.importeAcambiar.replace(/\./g, '').replace(',', '.'));

    const saldoEfectivoNuevo = Math.abs(saldoEfectivoOriginal + importeCambio);

    const saldoBancoNuevo = Math.abs(saldoBancoOriginal - importeCambio);

    this.utilsSVC.setUser({
      ... this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    })


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
      this.cerrarModal()
      this.router.navigate(['/home']); // ✅ Navegación DESPUÉS del toast
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
    this.opcionSeleccionada === 'first' ? await this.submitEtoB() : await this.submitBtoE();

  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

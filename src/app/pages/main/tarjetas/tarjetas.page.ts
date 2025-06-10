import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoOptions, MaskitoElementPredicate, maskitoTransform } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-tarjetas',
  templateUrl: './tarjetas.page.html',
  styleUrls: ['./tarjetas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, RouterLink, MaskitoDirective, ReactiveFormsModule]
})
export class TarjetasPage implements OnInit {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  nombreUser: string = '';

  formulario = new FormGroup({
    banco: new FormControl('', [Validators.required]),
    tarjeta: new FormControl('', [Validators.required, Validators.minLength(4)]),
    digitos: new FormControl('', [Validators.required]),
    fecha_cierre: new FormControl('', [Validators.required]),
    consumos: new FormControl([], [Validators.required])
  });

  constructor() { }

  ngOnInit() {
    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }
  }

  async canDismiss(data?: undefined, role?: string) {
    return role !== 'gesture';
  }

  readonly cardMask: MaskitoOptions = {
    mask: [
      ...Array(4).fill(/\d/),
    ],
  };

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

  infoCierre() {
    // this.utilsSVC.sweetAlert.fire({
    //   icon: "info",
    //   text: 'La fecha de cierre indica que hasta la fecha, los consumos que realices entraran para el proximo resumen de tu tarjeta, si compras pasada la fecha de cierre, los gastos realizados los abonaras 30 dias despues',
    //   draggable: true
    // });

  }


  async submit() {
    // if (this.formulario.valid) {

    //   const loading = await this.utilsSv.loading();
    //   await loading.present();


    //   this.firebaseSv.signIn(this.formulario.value as User).then(res => {

    //     this.getUserInfo(res.user.uid);

    //   }).catch(error => {
    //     console.log(error);

    //     this.utilsSv.presentToast({
    //       message: error.message,
    //       duration: 2500,
    //       color: 'primary',
    //       position: 'middle',
    //       icon: 'alert-circle-outline'
    //     })

    //   }).finally(() => {
    //     loading.dismiss();
    //   })
    // }
  }

}

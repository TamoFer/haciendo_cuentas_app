import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoOptions, MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tarjeta } from 'src/app/models/tarjeta.model';

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
    digitos: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    fecha_cierre: new FormControl(null, [Validators.required]),
    banco: new FormControl('', [Validators.required]),
    tarjeta: new FormControl('', [Validators.required]),
    consumos: new FormControl([])
  });

  public alertaInfo = [
    {
      text: 'OK',
      role: 'confirm',
    }
  ]

  getHoy(): string {
    const hoy = new Date();
    return hoy.toISOString().substring(0, 10); // yyyy-mm-dd
  }

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

  obtenerTarjetas() {
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => {
        this.utilsSVC.setTarjetas(res);
      },
      error: err => {
        console.error('Error obteniendo tarjetas', err);
      }
    });
  }


  async submit() {
    const loading = await this.utilsSVC.loading();
    await loading.present();
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      const Tarjeta: Tarjeta = {
        id: this.formulario.value.digitos!,
        fecha_cierre: this.formulario.value.fecha_cierre!,
        entidad_bancaria: this.formulario.value.banco!,
        tipo_tarjeta: this.formulario.value.tarjeta!,
        consumos: this.formulario.value.consumos!,
      };

      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Tarjeta ingresada con exito',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      })

    }).catch(error => {
      console.log(error);

      this.utilsSVC.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      })

    }).finally(() => {
      loading.dismiss();
    })
  }
}


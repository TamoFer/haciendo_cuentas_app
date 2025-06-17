import { CommonModule, NgFor } from '@angular/common';
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
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-tarjetas',
  templateUrl: './tarjetas.page.html',
  styleUrls: ['./tarjetas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, RouterLink, MaskitoDirective, ReactiveFormsModule, NgFor]
})
export class TarjetasPage implements OnInit {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  nombreUser: string = '';
  tarjetas: Tarjeta[] = [];
  subscripcionUser: Subscription;



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
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.usuario = user;
        this.obtenerDatosUsuario(user);
      }
    });

    this.utilsSVC.tarjetas$.subscribe(tarjeta => {
      this.tarjetas = tarjeta;
    });

    this.obtenerTarjetasUsuario();

  }

  obtenerDatosUsuario(user: User) {

    this.nombreUser = user.name;
    this.usuarioLogeado = true;
    this.obtenerTarjetasUsuario();
  }


  obtenerTarjetasUsuario() {
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

  async canDismiss(data?: undefined, role?: string) {
    return role !== 'gesture';
  }

  readonly cardMask: MaskitoOptions = {
    mask: [
      ...Array(4).fill(/\d/),
    ],
  };

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();




  async submit() {
    const loading = await this.utilsSVC.loading();
    await loading.present();
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      const Tarjeta: Tarjeta = {
        digitos: this.formulario.value.digitos!,
        fecha_cierre: this.formulario.value.fecha_cierre!,
        banco: this.formulario.value.banco!,
        tarjeta: this.formulario.value.tarjeta!,
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


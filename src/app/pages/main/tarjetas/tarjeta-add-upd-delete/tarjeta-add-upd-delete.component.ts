import { CommonModule } from '@angular/common';
import { Component, Inject, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoElementPredicate, MaskitoOptions } from '@maskito/core';
import { Subscription } from 'rxjs';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-tarjeta-add-upd-delete',
  templateUrl: './tarjeta-add-upd-delete.component.html',
  styleUrls: ['./tarjeta-add-upd-delete.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, ReactiveFormsModule, MaskitoDirective]
})
export class TarjetaAddUpdDeleteComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  nombreUser: string = '';
  tarjetas: Tarjeta[] = [];
  subscripcionUser: Subscription;

  @Input() tarjeta: Tarjeta;


  constructor() { }

  ngOnInit() {
    this.tarjeta ? this.formulario.patchValue(this.tarjeta) : this.formulario;

  }

  mostrarBack: boolean = true;

  formulario = new FormGroup({
    id: new FormControl(),
    digitos: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    fecha_cierre: new FormControl(null, [Validators.required]),
    banco: new FormControl('', [Validators.required]),
    tarjeta: new FormControl('', [Validators.required]),
    consumos: new FormControl(null)
  });

  public alertaInfo = [
    {
      text: 'OK',
      role: 'confirm',
    }
  ]

  async canDismiss(data?: undefined, role?: string) {
    return role !== 'gesture';
  }

  readonly cardMask: MaskitoOptions = {
    mask: [
      ...Array(4).fill(/\d/),
    ],
  };

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

  async editarTarjeta() {

    const loading = await this.utilsSVC.loading();
    await loading.present();



    let path = `users/${this.usuario.uid}/tarjetas/${this.tarjeta.id}`;


    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {


      const tarjeta: Tarjeta = {
        id: this.tarjeta.id,
        fecha_cierre: this.formulario.value.fecha_cierre!,
        digitos: this.formulario.value.digitos!,
        banco: this.formulario.value.banco!,
        tarjeta: this.formulario.value.tarjeta!,
        consumos: this.formulario.value.consumos!

      };

      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Gasto actualizado con exito',
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


  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}





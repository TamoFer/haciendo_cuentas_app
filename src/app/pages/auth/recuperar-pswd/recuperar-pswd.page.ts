import { Component, inject, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';
import { CommonModule, NgIf } from '@angular/common';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-recuperar-pswd',
  templateUrl: './recuperar-pswd.page.html',
  styleUrls: ['./recuperar-pswd.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    IngresoDatosComponent,
    HeaderComponent,
    ReactiveFormsModule
  ],
  standalone: true
})

export class RecuperarPswdPage implements OnInit {

  formulario = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  firebaseSv = inject(FirebaseService);
  utilsSv = inject(UtilsService);

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  retroceder() {
    this.navCtrl.back();
  }


  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSv.loading();
      await loading.present();


      this.firebaseSv.enviarRecuperacion(this.formulario.value.email).then(res => {

        this.utilsSv.presentToast({
          message: `Se ha enviado un link de recuperacion al correo: ${this.formulario.value.email}`,
          duration: 1500,
          color: 'primary',
          position: 'middle',
          icon: 'alert-circle-outline'
        })

      }).catch(error => {
        console.log(error);

        this.utilsSv.presentToast({
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

}

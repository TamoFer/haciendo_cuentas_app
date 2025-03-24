import { Component, inject, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-registro-usuario',
  templateUrl: './registro-usuario.page.html',
  styleUrls: ['./registro-usuario.page.scss'],
  imports: [IonicModule, HeaderComponent, IngresoDatosComponent, ReactiveFormsModule, NgIf]
})



export class RegistroUsuarioPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  formulario = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),

  });

  firebaseSv = inject(FirebaseService);
  utilsSv = inject(UtilsService);

  ngOnInit() {
  }

  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSv.loading();
      await loading.present();


      this.firebaseSv.signUp(this.formulario.value as User).then(async res => {

        await this.firebaseSv.updateUser(this.formulario.value.name);

        let uid = res.user.uid;
        this.formulario.controls.uid.setValue(uid);

        this.setUserInfo(uid);


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

  async setUserInfo(uid: string) {
    if (this.formulario.valid) {

      const loading = await this.utilsSv.loading();
      await loading.present();

      let path = `users/${uid}`
      delete this.formulario.value.password;

      this.firebaseSv.setDocument(path, this.formulario.value).then(async res => {

        await this.utilsSv.guardarDatosLS('user', this.formulario.value);
        this.utilsSv.routerLink('/main/home');
        this.formulario.reset();

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

  retroceder() {
    this.navCtrl.back();
  }

}

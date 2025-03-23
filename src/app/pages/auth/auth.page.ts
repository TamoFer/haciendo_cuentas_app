import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [IonicModule, HeaderComponent, IngresoDatosComponent, ReactiveFormsModule, RouterLink, NgIf]
})

export class AuthPage implements OnInit {

  formulario = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  firebaseSv = inject(FirebaseService);
  utilsSv = inject(UtilsService);

  ngOnInit() {
  }

  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSv.loading();
      await loading.present();


      this.firebaseSv.signIn(this.formulario.value as User).then(res => {
        console.log(res);

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

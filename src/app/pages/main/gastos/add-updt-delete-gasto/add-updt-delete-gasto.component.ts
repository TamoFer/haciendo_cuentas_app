import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';

@Component({
  selector: 'app-add-updt-delete-gasto',
  templateUrl: './add-updt-delete-gasto.component.html',
  styleUrls: ['./add-updt-delete-gasto.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, ReactiveFormsModule, IngresoDatosComponent, NgIf]

})
export class AddUpdtDeleteGastoComponent {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  mostrarBack: boolean = true;

  formulario = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.min(0)]),
    importe: new FormControl('', [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl('', [Validators.required, Validators.minLength(6)]),
    tipo: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  ngOnInit() {
  }

  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSVC.loading();
      await loading.present();


      //   this.firebaseSVC.signUp(this.formulario.value as Ingreso).then(async res => {

      //     await this.firebaseSVC.updateUser(this.formulario.value.detalle);

      //     let uid = res.user.uid;
      //     // this.formulario.controls.uid.setValue(uid);

      //   }).catch(error => {
      //     console.log(error);

      //     this.utilsSVC.presentToast({
      //       message: error.message,
      //       duration: 2500,
      //       color: 'primary',
      //       position: 'middle',
      //       icon: 'alert-circle-outline'
      //     })

      //   }).finally(() => {
      //     loading.dismiss();
      //   })
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
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
  user = {} as User;

  opcionesRubro = ['Compra', 'Regalo', 'Deudas', 'Servicios'];
  opcionesTipo = ['Efectivo', 'Dinero en cuenta'];

  formulario = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    genero: new FormControl('gasto')
  });

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');

  }

  async submit() {
    if (this.formulario.valid) {

      const loading = await this.utilsSVC.loading();
      await loading.present();


      let path = `users/${this.user.uid}/movimientos`;

      this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

        this.utilsSVC.dismissModal({ success: true });

        this.utilsSVC.presentToast({
          message: 'Gasto ingresado con exito',
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

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

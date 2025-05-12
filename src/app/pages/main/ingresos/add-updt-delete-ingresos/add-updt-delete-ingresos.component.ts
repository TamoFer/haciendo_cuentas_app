import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';

@Component({
  selector: 'app-add-updt-delete-ingresos',
  templateUrl: './add-updt-delete-ingresos.component.html',
  styleUrls: ['./add-updt-delete-ingresos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, IngresoDatosComponent, NgIf, ReactiveFormsModule]
})
export class AddUpdtDeleteIngresosComponent {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  dataSyncService = inject(RefreshService);

  mostrarBack: boolean = true;

  opcionesRubro = ['Sueldo', 'Venta', 'Prestamo', 'Apuesta', 'Changa', 'Saldo'];
  opcionesTipo = ['Efectivo', 'Dinero en cuenta'];

  user = {} as User;

  formulario = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    genero: new FormControl('ingreso')

  });


  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');

  }

  async submit() {
    if (this.formulario.valid) {

      let path = `users/${this.user.uid}/movimientos`;

      const loading = await this.utilsSVC.loading();
      await loading.present();



      this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

        this.sumarSaldos(this.formulario.value);

        this.utilsSVC.dismissModal({ success: true });

        this.utilsSVC.presentToast({
          message: 'Ingreso cargado con exito',
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

      this.dataSyncService.triggerActualizar();
    }
  }

  sumarSaldos(movimiento) {
    const path = `users/${this.user.uid}`;

    let nuevoSaldoBco = this.user.saldo_banco;
    let nuevoSaldoEfe = this.user.saldo_efectivo;

    movimiento.tipo === 'Efectivo' ?
      nuevoSaldoEfe += Number(this.formulario.value.importe) :
      nuevoSaldoBco += Number(this.formulario.value.importe);

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })

    this.utilsSVC.guardarDatosLS('user', {
      ... this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }


}

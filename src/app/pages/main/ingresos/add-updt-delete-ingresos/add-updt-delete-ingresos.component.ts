import { NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
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

  @Input() ingreso: Movimiento;

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  mostrarBack: boolean = true;

  opcionesRubro = ['Sueldo', 'Venta', 'Prestamo', 'Apuesta', 'Changa', 'Saldo'];
  opcionesTipo = ['Efectivo', 'Dinero en cuenta'];

  user = {} as User;
  idContador: number;


  formulario = new FormGroup({
    id: new FormControl(null),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    genero: new FormControl('ingreso')

  });


  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    console.log(this.ingreso);

    if (this.ingreso) this.formulario.setValue(this.ingreso);
    console.log(this.user.movimientos.length);

    this.user.movimientos ? this.idContador += this.user.movimientos.length + 1 : this.idContador = 1;
  }

  submit() {
    if (this.formulario.valid) {
      this.ingreso ? this.editarIngreso() : this.crearIngreso();
    }
  }

  async editarIngreso() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos/${this.ingreso.id}`;

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {

      this.sumarSaldos(this.formulario.value);

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

  async crearIngreso() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos`;
    this.formulario.get('id').setValue(this.idContador);

    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      this.sumarSaldos(this.formulario.value);

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

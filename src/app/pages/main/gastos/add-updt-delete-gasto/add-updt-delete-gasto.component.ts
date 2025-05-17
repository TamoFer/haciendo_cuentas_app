import { NgIf } from '@angular/common';
import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
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
  selector: 'app-add-updt-delete-gasto',
  templateUrl: './add-updt-delete-gasto.component.html',
  styleUrls: ['./add-updt-delete-gasto.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, ReactiveFormsModule, IngresoDatosComponent, NgIf]

})
export class AddUpdtDeleteGastoComponent {


  @Input() gasto: Movimiento

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    this.gasto ? this.formulario.patchValue(this.gasto) : this.formulario;
    this.user.movimientos ? this.idContador = this.user.movimientos.length + 1 : this.idContador = 1;
  }

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);


  mostrarBack: boolean = true;
  user = {} as User;
  idContador: number;

  opcionesRubro = ['Compra', 'Regalo', 'Deudas', 'Servicios'];
  opcionesTipo = ['Efectivo', 'Dinero en cuenta'];

  formulario = new FormGroup({
    id: new FormControl(null,),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    genero: new FormControl('gasto')
  });






  submit() {
    if (this.formulario.valid) {
      this.gasto ? this.editarGasto() : this.crearGasto();
    }
  }

  async editarGasto() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos/${this.gasto.id}`;

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {

      this.restarSaldos(this.formulario.value);

      const movimiento: Movimiento = {
        id: this.gasto.id,
        fecha: this.formulario.value.fecha!,
        importe: this.formulario.value.importe!,
        detalle: this.formulario.value.detalle!,
        rubro: this.formulario.value.rubro!,
        tipo: this.formulario.value.tipo!,
        genero: this.formulario.value.genero!
      };

      this.utilsSVC.actualizarMovimiento(movimiento);
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

  async crearGasto() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos`;

    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      this.restarSaldos(this.formulario.value);

      const movimiento: Movimiento = {
        id: res.id,
        fecha: this.formulario.value.fecha!,
        importe: this.formulario.value.importe!,
        detalle: this.formulario.value.detalle!,
        rubro: this.formulario.value.rubro!,
        tipo: this.formulario.value.tipo!,
        genero: this.formulario.value.genero!
      };

      this.utilsSVC.agregarMovimiento(movimiento);

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


  restarSaldos(movimiento) {
    const path = `users/${this.user.uid}`;

    let nuevoSaldoBco = this.user.saldo_banco;
    let nuevoSaldoEfe = this.user.saldo_efectivo;

    movimiento.tipo === 'Efectivo' ?
      nuevoSaldoEfe -= Number(this.formulario.value.importe) :
      nuevoSaldoBco -= Number(this.formulario.value.importe);

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })

    this.utilsSVC.setUser({
      ... this.user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    })
  }


  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

import { NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { MaskitoElementPredicate } from '@maskito/core';


@Component({
  selector: 'app-add-updt-delete-ingresos',
  templateUrl: './add-updt-delete-ingresos.component.html',
  styleUrls: ['./add-updt-delete-ingresos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, IngresoDatosComponent, NgIf, ReactiveFormsModule, MaskitoDirective]
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

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

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

    if (this.ingreso) this.formulario.setValue(this.ingreso);

    this.user.movimientos ? this.idContador += this.user.movimientos.length + 1 : this.idContador = 1;
  }



  async editarIngreso() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/movimientos/${this.ingreso.id}`;
    this.actualizarMovimiento(this.ingreso);

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {


      const movimiento: Movimiento = {
        id: this.ingreso.id,
        fecha: this.formulario.value.fecha!,
        importe: Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')),
        detalle: this.formulario.value.detalle!,
        rubro: this.formulario.value.rubro!,
        tipo: this.formulario.value.tipo!,
        genero: this.formulario.value.genero!
      };

      this.utilsSVC.actualizarMovimiento(movimiento);
      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Ingreso actualizado con exito',
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
      const movimiento: Movimiento = {
        id: this.formulario.value.id!,
        fecha: this.formulario.value.fecha!,
        importe: Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')),
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

  actualizarMovimiento(ingreso) {
    const path = `users/${this.user.uid}`;

    const nuevo = this.formulario.value;
    const original = Number(String(this.ingreso.importe).replace(/\./g, '').replace(',', '.'));

    let saldoEfectivoNuevo = this.user.saldo_efectivo
    let saldoBancoNuevo = this.user.saldo_banco

    const nuevoImporte = Number(nuevo.importe?.replace(/\./g, '').replace(',', '.'));
    const importeAnterior = original;

    const diferencia = Math.abs(nuevoImporte - importeAnterior);

    if (nuevo.tipo === 'Efectivo') {
      if (nuevoImporte > importeAnterior) {
        saldoEfectivoNuevo += diferencia
      } else if (nuevoImporte < importeAnterior) {
        saldoEfectivoNuevo -= diferencia
      }
    } else if (nuevo.tipo != 'Efectivo') {
      if (nuevoImporte > importeAnterior) {
        saldoBancoNuevo += diferencia

      } else if (nuevoImporte < importeAnterior) {
        saldoBancoNuevo -= diferencia
      }
    }

    this.firebaseSVC.updateDocument(path, {
      ...this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    })

    this.utilsSVC.setUser({
      ... this.user,
      saldo_banco: saldoBancoNuevo,
      saldo_efectivo: saldoEfectivoNuevo
    })



  }

  sumarSaldos(movimiento) {
    const path = `users/${this.user.uid}`;

    let nuevoSaldoBco = this.user.saldo_banco;
    let nuevoSaldoEfe = this.user.saldo_efectivo;

    movimiento.tipo === 'Efectivo' ?
      nuevoSaldoEfe += Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')) :
      nuevoSaldoBco += Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.'));

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

  submit() {
    if (this.formulario.valid) {
      this.ingreso ? this.editarIngreso() : this.crearIngreso();
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

import { NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { Movimiento } from 'src/app/models/movimiento.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { MaskitoElementPredicate } from '@maskito/core';

interface Rubro {
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-add-updt-delete-gasto',
  templateUrl: './add-updt-delete-gasto.component.html',
  styleUrls: ['./add-updt-delete-gasto.component.scss'],
  imports: [IonicModule, ReactiveFormsModule, MaskitoDirective, NgIf]

})
export class AddUpdtDeleteGastoComponent {


  @Input() gasto: Movimiento;
  @Input() rubros: Rubro[] = [];

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);


  user = {} as User;
  tipos = [
    { nombre: 'Banco', icono: 'business-outline' },
    { nombre: 'Efectivo', icono: 'cash-outline' },
  ];

  formulario = new FormGroup({
    id: new FormControl(null),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    fijo: new FormControl(false),
    genero: new FormControl('gasto')
  });

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  get esEdicion(): boolean {
    return !!this.gasto;
  }

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    if (this.gasto) {
      this.formulario.patchValue(this.gasto);
      this.formulario.controls.importe.setValue(
        this.gasto.importe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    }
  }


  async crearGasto() {

    const loading = await this.utilsSVC.loading();
    await loading.present();

    if (this.saldoNegativoAlert(this.formulario.value)) {
      let path = `users/${this.user.uid}/movimientos`;

      this.formulario.value.id = String(this.utilsSVC.crearId())

      this.formulario.value.importe = String(this.formulario.value.importe).replace(/\./g, '').replace(',', '.');

      this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

        this.restarSaldos(this.formulario.value)
        const movimiento: Movimiento = {
          id: this.formulario.value.id,
          fecha: this.formulario.value.fecha!,
          importe: Number(this.formulario.value.importe),
          detalle: this.formulario.value.detalle!,
          rubro: this.formulario.value.rubro!,
          tipo: this.formulario.value.tipo!,
          fijo: this.formulario.value.fijo!,
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
  }


  async editarGasto() {

    const loading = await this.utilsSVC.loading();
    await loading.present();

    if (this.saldoNegativoAlert(this.formulario.value)) {

      let path = `users/${this.user.uid}/movimientos/${this.gasto.id}`;
      this.actualizarMovimiento(this.gasto);

      this.formulario.value.importe = String(this.formulario.value.importe).replace(/\./g, '').replace(',', '.');

      this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {


        const movimiento: Movimiento = {
          id: this.gasto.id,
          fecha: this.formulario.value.fecha!,
          importe: Number(this.formulario.value.importe),
          detalle: this.formulario.value.detalle!,
          rubro: this.formulario.value.rubro!,
          tipo: this.formulario.value.tipo!,
          fijo: this.formulario.value.fijo!,
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

  }

  actualizarMovimiento(gasto: Movimiento) {
    const path = `users/${this.user.uid}`;

    const nuevo = this.formulario.value;
    const original = Number(String(this.gasto.importe).replace(/\./g, '').replace(',', '.'));

    let saldoEfectivoNuevo = this.user.saldo_efectivo
    let saldoBancoNuevo = this.user.saldo_banco

    const nuevoImporte = Number(nuevo.importe)
    const importeAnterior = original;

    const diferencia = Math.abs(nuevoImporte - importeAnterior);

    if (nuevo.tipo === 'Efectivo') {
      if (nuevoImporte > importeAnterior) {
        saldoEfectivoNuevo -= diferencia
      } else if (nuevoImporte < importeAnterior) {
        saldoEfectivoNuevo += diferencia
      }
    } else if (nuevo.tipo != 'Efectivo') {
      if (nuevoImporte > importeAnterior) {
        saldoBancoNuevo -= diferencia

      } else if (nuevoImporte < importeAnterior) {
        saldoBancoNuevo += diferencia
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

  saldoNegativoAlert(movimiento) {

    const importe = Number(String(movimiento.importe).replace(/\./g, '').replace(',', '.'));
    const tipo = movimiento.tipo;
    let condicional: boolean = false

    const saldoDisponible = tipo === 'Efectivo' ? this.user.saldo_efectivo : this.user.saldo_banco;

    if (importe > saldoDisponible) {
      this.utilsSVC.loadingCtrl.dismiss()
      this.utilsSVC.presentToast({
        message: `Saldo insuficiente en ${tipo.toLowerCase()}`,
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return condicional
    } else {
      return condicional = true
    }
  }

  cambiarEstado() {
    this.formulario.value.fijo = !this.formulario.value.fijo;
  }

  seleccionarRubro(nombre: string) {
    this.formulario.controls.rubro.setValue(
      this.formulario.controls.rubro.value === nombre ? null : nombre
    );
  }

  seleccionarTipo(nombre: string) {
    this.formulario.controls.tipo.setValue(
      this.formulario.controls.tipo.value === nombre ? null : nombre
    );
  }

  submit() {
    if (this.formulario.valid) {
      this.gasto ? this.editarGasto() : this.crearGasto();
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}
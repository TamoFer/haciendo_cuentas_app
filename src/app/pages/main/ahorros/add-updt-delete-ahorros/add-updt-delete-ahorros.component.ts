import { NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { MaskitoElementPredicate } from '@maskito/core';
import { Ahorro } from 'src/app/models/ahorro.model';
import { Meta } from 'src/app/models/metas.model';


@Component({
  selector: 'app-add-updt-delete-ahorros',
  templateUrl: './add-updt-delete-ahorros.component.html',
  styleUrls: ['./add-updt-delete-ahorros.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, IngresoDatosComponent, NgIf, ReactiveFormsModule, MaskitoDirective]
})
export class AddUpdtDeleteAhorrosComponent {

  @Input() ahorro: Ahorro;

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  mostrarBack: boolean = true;


  opcionesMoneda = ['Pesos Argentinos', 'Dolares'];

  user = {} as User;
  listadoMetas = [];
  metaRelacionada: Meta;
  metas: Meta[] = [];



  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    id: new FormControl(''),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe: new FormControl(null, [Validators.required, Validators.min(0)]),
    detalle: new FormControl(null, Validators.required),
    moneda: new FormControl(null, Validators.required),
    meta: new FormControl(null),
  });


  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
    if (this.ahorro) {
      this.formulario.setValue({
        id: this.ahorro.id,
        fecha: this.ahorro.fecha,
        importe: this.ahorro.importe,
        detalle: this.ahorro.detalle,
        moneda: this.ahorro.moneda,
        meta: this.ahorro.meta,
      });
    }

    this.utilsSVC.metas$.subscribe(metas => {
      this.metas = metas;
    });

    this.obtenerMetasUsuario();
  }

  obtenerMetasUsuario() {
    const path = `users/${this.user.uid}/metas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Meta[]) => {
        this.utilsSVC.setMetas(res);
        for (let meta of res) {
          this.listadoMetas.push(`${meta.nombre}`.toUpperCase())
        }
      },
      error: err => {
        console.error('Error obteniendo metas', err);
      }
    });
  }


  async editarAhorro() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/ahorros/${this.ahorro.id}`;
    // this.actualizarMovimiento(this.ahorro);

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {


      const ahorro: Ahorro = {
        id: this.formulario.value.id,
        fecha: this.formulario.value.fecha!,
        importe: Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')),
        detalle: this.formulario.value.detalle!,
        moneda: this.formulario.value.moneda!,
        meta: this.formulario.value.meta!,
      };

      // this.utilsSVC.actualizarMovimiento(ahorro);
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

  async crearAhorro() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/ahorros`;

    this.formulario.value.id = String(this.utilsSVC.crearId())


    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      const ahorro: Ahorro = {
        id: this.formulario.value.id,
        fecha: this.formulario.value.fecha!,
        importe: Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')),
        detalle: this.formulario.value.detalle!,
        moneda: this.formulario.value.moneda!,
        meta: this.formulario.value.meta!,
      };

      this.utilsSVC.agregarAhorros(ahorro);

      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Ahorro generado con exito',
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

  // actualizarMovimiento(meta) {
  //   const path = `users/${this.user.uid}`;

  //   const nuevo = this.formulario.value;
  //   const original = Number(String(this.meta.importe).replace(/\./g, '').replace(',', '.'));

  //   let saldoEfectivoNuevo = this.user.saldo_efectivo
  //   let saldoBancoNuevo = this.user.saldo_banco

  //   const nuevoImporte = Number(nuevo.importe?.replace(/\./g, '').replace(',', '.'));
  //   const importeAnterior = original;

  //   const diferencia = Math.abs(nuevoImporte - importeAnterior);

  //   if (nuevo.tipo === 'Efectivo') {
  //     if (nuevoImporte > importeAnterior) {
  //       saldoEfectivoNuevo += diferencia
  //     } else if (nuevoImporte < importeAnterior) {
  //       saldoEfectivoNuevo -= diferencia
  //     }
  //   } else if (nuevo.tipo != 'Efectivo') {
  //     if (nuevoImporte > importeAnterior) {
  //       saldoBancoNuevo += diferencia

  //     } else if (nuevoImporte < importeAnterior) {
  //       saldoBancoNuevo -= diferencia
  //     }
  //   }

  //   this.firebaseSVC.updateDocument(path, {
  //     ...this.user,
  //     saldo_banco: saldoBancoNuevo,
  //     saldo_efectivo: saldoEfectivoNuevo
  //   })

  //   this.utilsSVC.setUser({
  //     ... this.user,
  //     saldo_banco: saldoBancoNuevo,
  //     saldo_efectivo: saldoEfectivoNuevo
  //   })



  // }

  // sumarSaldos(movimiento) {
  //   const path = `users/${this.user.uid}`;

  //   let nuevoSaldoBco = this.user.saldo_banco;
  //   let nuevoSaldoEfe = this.user.saldo_efectivo;

  //   movimiento.tipo === 'Efectivo' ?
  //     nuevoSaldoEfe += Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.')) :
  //     nuevoSaldoBco += Number(this.formulario.value.importe!.replace(/\./g, '').replace(',', '.'));

  //   this.firebaseSVC.updateDocument(path, {
  //     ...this.user,
  //     saldo_banco: nuevoSaldoBco,
  //     saldo_efectivo: nuevoSaldoEfe
  //   })

  //   this.utilsSVC.setUser({
  //     ... this.user,
  //     saldo_banco: nuevoSaldoBco,
  //     saldo_efectivo: nuevoSaldoEfe
  //   })
  // }

  // cambiarEstado() {
  //   this.formulario.value.fijo = !this.formulario.value.fijo;
  // }

  submit() {
    if (this.formulario.valid) {
      this.ahorro ? this.editarAhorro() : this.crearAhorro();
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}


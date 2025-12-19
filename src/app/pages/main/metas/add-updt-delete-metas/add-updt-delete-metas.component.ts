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
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';
import { MaskitoElementPredicate } from '@maskito/core';
import { Meta } from 'src/app/models/metas.model';


@Component({
  selector: 'app-add-updt-delete-metas',
  templateUrl: './add-updt-delete-metas.component.html',
  styleUrls: ['./add-updt-delete-metas.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, IngresoDatosComponent, NgIf, ReactiveFormsModule, MaskitoDirective]
})
export class AddUpdtDeleteMetasComponent {

  @Input() meta: Meta;

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  mostrarBack: boolean = true;

  user = {} as User;

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });

  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    id: new FormControl(''),
    fecha_comienzo: new FormControl(null),
    valor: new FormControl(null, [Validators.required, Validators.min(1)]),
    moneda: new FormControl('Pesos Argentinos'),
    detalle: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    nombre: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    ahorrado: new FormControl([]),
  });


  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');

    if (this.meta) {
      this.formulario.setValue({
        id: this.meta.id,
        fecha_comienzo: this.meta.fecha_comienzo,
        valor: String(this.meta.valor),
        detalle: this.meta.detalle,
        nombre: this.meta.nombre,
        moneda: this.meta.moneda,
        ahorrado: this.meta.ahorrado ?? [],
      });
    }


  }





  async crearMeta() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/metas`;

    this.formulario.value.id = String(this.utilsSVC.crearId())
    this.formulario.value.fecha_comienzo = Date.now();
    this.formulario.value.valor = Number(this.formulario.value.valor.replace(/\./g, '').replace(',', '.'));


    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      const meta: Meta = {
        id: this.formulario.value.id,
        fecha_comienzo: this.formulario.value.fecha_comienzo!,
        valor: this.formulario.value.valor!,
        moneda: this.formulario.value.moneda!,
        detalle: this.formulario.value.detalle!,
        nombre: this.formulario.value.nombre!,
        ahorrado: this.formulario.value.ahorrado!
      };

      this.utilsSVC.agregarMetas(meta);

      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Meta generada con exito',
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

  async editarMeta() {

    const loading = await this.utilsSVC.loading();
    await loading.present();


    let path = `users/${this.user.uid}/metas/${this.meta.id}`;
    this.formulario.value.valor = Number(this.formulario.value.valor.replace(/\./g, '').replace(',', '.'));

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {


      const meta: Meta = {
        id: this.meta.id,
        fecha_comienzo: this.meta.fecha_comienzo,
        valor: this.formulario.value.valor,
        detalle: this.formulario.value.detalle!,
        nombre: this.formulario.value.nombre!,
        moneda: this.formulario.value.moneda!,
        ahorrado: this.meta.ahorrado!
      };

      this.utilsSVC.actualizarMetas(meta);
      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Meta actualizada con exito',
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

  // actualizarMeta(meta) {
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

  cambiarMoneda() {
    this.formulario.controls.moneda.setValue('USD');

  }

  submit() {
    if (this.formulario.valid) {
      this.meta ? this.editarMeta() : this.crearMeta();
    }
  }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

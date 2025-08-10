import { CommonModule, NgFor } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MaskitoElementPredicate } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { Subscription } from 'rxjs';
import { Consumo } from 'src/app/models/consumoTarjeta.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';

@Component({
  selector: 'app-add-update-delete-consumos',
  templateUrl: './add-update-delete-consumos.component.html',
  styleUrls: ['./add-update-delete-consumos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, ReactiveFormsModule, IngresoDatosComponent]
})
export class AddUpdateDeleteConsumosComponent implements OnInit {


  @Input() consumo: Consumo;
  @Input() maskito: any;
  @Input() maskitoElement: any;

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  usuario = {} as User;

  subscripcionUser: Subscription;
  nombreUser: string = '';
  tarjetas: Tarjeta[] = [];
  mostrarBack: boolean = true;
  idContador: number;
  listadoTarjetas = [];
  tarjetaRelacionada: Tarjeta;


  formulario = new FormGroup({
    id: new FormControl(null),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe_total: new FormControl(null, [Validators.required, Validators.min(0)]),
    cuotificacion: new FormControl(null, [Validators.required]),
    detalle: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    tarjeta: new FormControl(),
  });

  public alertaInfo = [
    {
      text: 'OK',
      role: 'confirm',
    }
  ]

  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });


  readonly maskPredicate: MaskitoElementPredicate = async (el) => ((el as unknown) as HTMLIonInputElement).getInputElement();

  constructor() { }

  ngOnInit() {
    this.usuario = this.utilsSVC.obtenerDatosLS('user');
    this.consumo ? this.formulario.patchValue(this.consumo) : this.formulario;
    this.usuario.movimientos ? this.idContador = this.usuario.movimientos.length + 1 : this.idContador = 1;

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
    }



    this.utilsSVC.tarjetas$.subscribe(tarjeta => {
      this.tarjetas = tarjeta;
    });

    this.obtenerTarjetasUsuario()

  }


  obtenerTarjetasUsuario() {
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => {
        this.utilsSVC.setTarjetas(res);
        for (let tarjeta of res) {
          this.listadoTarjetas.push(`${tarjeta.banco} -  ${tarjeta.tarjeta} - ${tarjeta.digitos}`)
        }
      },
      error: err => {
        console.error('Error obteniendo tarjetas', err);
      }
    });
  }

  asociarTarjeta(tarjeta: string) {
    for (let t of this.tarjetas) {
      if (tarjeta.toLowerCase().includes(String(t.digitos).toLocaleLowerCase())) {
        this.tarjetaRelacionada = t;
      } else {
        this.tarjetaRelacionada = {} as Tarjeta;
        console.warn('No se encontró la tarjeta asociada');
      }
    }
    return this.tarjetaRelacionada;

  }


  async crearConsumo() {

    const loading = await this.utilsSVC.loading();
    await loading.present();
    this.asociarTarjeta(this.formulario.value.tarjeta!);

    let path = `users/${this.usuario.uid}/tarjetas/${this.tarjetaRelacionada.id}/consumos`;


    let importeParseado = Number(this.formulario.value.importe_total!.replace(/\./g, '').replace(',', '.'))
    console.log(this.tarjetaRelacionada);

    this.firebaseSVC.addDocument(path, this.formulario.value).then(async res => {

      const consumo: Consumo = {
        id: this.formulario.value.id!,
        fecha: this.formulario.value.fecha!,
        importe_total: importeParseado,
        detalle: this.formulario.value.detalle!,
        cuotificacion: this.formulario.value.cuotificacion!,
        tarjeta_asociada: this.tarjetaRelacionada,
      };

      this.utilsSVC.agregarConsumo(consumo);
      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Consumo ingresado con exito',
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



  async editarConsumo() {

    const loading = await this.utilsSVC.loading();
    await loading.present();

    this.asociarTarjeta(this.formulario.value.tarjeta!);

    let path = `users/${this.usuario.uid}/tarjetas/${this.tarjetaRelacionada.id}/consumos/${this.consumo.id}`;


    let importeParseado = Number(this.formulario.value.importe_total!.replace(/\./g, '').replace(',', '.'))

    this.firebaseSVC.updateDocument(path, this.formulario.value).then(async res => {

      const consumo: Consumo = {
        id: this.consumo.id,
        fecha: this.formulario.value.fecha!,
        importe_total: importeParseado,
        detalle: this.formulario.value.detalle!,
        cuotificacion: this.formulario.value.cuotificacion!,
        tarjeta_asociada: this.tarjetaRelacionada,
      };

      this.utilsSVC.actualizarConsumos(this.consumo);
      this.utilsSVC.dismissModal({ success: true });

      this.utilsSVC.presentToast({
        message: 'Consumo actualizado con exito',
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



  submit() {
    if (this.formulario.valid) {
      this.consumo ? this.editarConsumo() : this.crearConsumo();
    }
  }


  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}

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
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-add-update-delete-consumos',
  templateUrl: './add-update-delete-consumos.component.html',
  styleUrls: ['./add-update-delete-consumos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, RouterLink, ReactiveFormsModule, NgFor]
})
export class AddUpdateDeleteConsumosComponent implements OnInit {


  @Input() consumo: Consumo;

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  usuario = this.utilsSVC.obtenerDatosLS('user');
  subscripcionUser: Subscription;
  nombreUser: string = '';
  tarjetas: Tarjeta[] = [];
  mostrarBack: boolean = true;

  formulario = new FormGroup({
    id: new FormControl(null),
    fecha: new FormControl(null, [Validators.required, Validators.min(0)]),
    importe_total: new FormControl(null, [Validators.required, Validators.min(0)]),
    cuotificacion: new FormControl('', [Validators.required]),
    detalle: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    tarjeta: new FormControl(null, [Validators.required]),
  });

  public alertaInfo = [
    {
      text: 'OK',
      role: 'confirm',
    }
  ]

  constructor() { }

  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
    }



    this.utilsSVC.tarjetas$.subscribe(tarjeta => {
      this.tarjetas = tarjeta;
    });

    this.obtenerTarjetasUsuario();

  }

  obtenerTarjetasUsuario() {
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => {
        this.utilsSVC.setTarjetas(res);
      },
      error: err => {
        console.error('Error obteniendo tarjetas', err);
      }
    });
  }


  mascara = maskitoNumberOptionsGenerator({
    decimalSeparator: ',',
    thousandSeparator: '.',
    maximumFractionDigits: 2,
  });


  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }
}

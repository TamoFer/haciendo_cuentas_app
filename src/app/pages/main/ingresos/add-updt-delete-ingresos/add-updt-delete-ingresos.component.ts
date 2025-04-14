import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  mostrarBack: boolean = true;

  opcionesRubro = ['Sueldo', 'Venta', 'Prestamo'];
  opcionesTipo = ['Efectivo', 'Tarjeta'];
  usuarioActual = this.utilsSVC.obtenerDatosLS('user');


  formulario = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.min(0)]),
    importe: new FormControl('', [Validators.required, Validators.min(0)]),
    detalle: new FormControl('', [Validators.required, Validators.minLength(1)]),
    rubro: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
  });

  ngOnInit() {
    console.log(this.usuarioActual);

  }

  async nuevoIngreso() {
    if (this.formulario.valid) {

      const loading = await this.utilsSVC.loading();
      await loading.present();

      const path = `users/${this.usuarioActual.uid}`;

      const usuarioData = await this.firebaseSVC.getDocument(path);
      const ingresosActuales = usuarioData?.['ingresos'] || [];

      const nuevoIngreso = this.formulario.value;
      const nuevosIngresos = [...ingresosActuales, nuevoIngreso];

      await this.firebaseSVC.setDocument(path, {
        ...usuarioData,
        gastos: nuevosIngresos
      });

      // this.actualizarDatosLS(this.usuarioActual.uid);


    }
  }

  async actualizarDatosLS(uid: string) {
    const path = `users/${uid}`;

    this.firebaseSVC.getDocument(path).then((user: User) => {
      this.utilsSVC.guardarDatosLS('user', user);
    });

    this.utilsSVC.obtenerDatosLS('user');

  }
  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

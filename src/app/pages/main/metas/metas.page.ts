import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Meta } from 'src/app/models/metas.model';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-metas',
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class MetasPage implements OnInit {

  // @section: services
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  // @endsection

  // @section: variables
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  metas: Meta[] = [];


  // @endsection


  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.metas$.subscribe(tarjeta => {
      this.metas = tarjeta;
    });

  }

  obtenerMetasUsuario() {
    const path = `users/${this.usuario.uid}/metas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Meta[]) => {
        this.utilsSVC.setMetas(res);
      },
      error: err => {
        console.error('Error obteniendo metas', err);
      }
    });
  }



  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

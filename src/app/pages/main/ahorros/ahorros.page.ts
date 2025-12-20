import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { Ahorro } from 'src/app/models/ahorro.model';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.page.html',
  styleUrls: ['./ahorros.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]

})
export class AhorrosPage implements OnInit {

  // @section: services
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  // @endsection

  // @section: variables
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  ahorros: Ahorro[] = [];


  // @endsection


  constructor() { }


  ngOnInit() {

    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.ahorros$.subscribe(ahorros => {
      this.ahorros = ahorros;
    });

    this.obtenerAhorrosUsuario()


  }

  obtenerAhorrosUsuario() {
    const path = `users/${this.usuario.uid}/ahorros`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Ahorro[]) => {
        this.utilsSVC.setAhorros(res);
      },
      error: err => {
        console.error('Error obteniendo ahorros', err);
      }
    });
  }

  // async crearMeta(meta?: Meta) {
  //   const modal = await this.utilsSVC.modalsCtrl.create({
  //     component: AddUpdtDeleteMetasComponent,
  //     componentProps: {
  //       meta: meta // ✅ PASA el movimiento si existe
  //     }
  //   });

  //   await modal.present();
  // }

  //  async crearAhoroo(ahorro?: Ahorro {
  //   const modal = await this.utilsSVC.modalsCtrl.create({
  //     component: Add,
  //     componentProps: {
  //       meta: ahorro // ✅ PASA el movimiento si existe
  //     }
  //   });

  //   await modal.present();
  // }


  // obtenerMetasUsuario() {
  //   const path = `users/${this.usuario.uid}/metas`;

  //   this.firebaseSVC.getCollectionData(path).subscribe({
  //     next: (res: Meta[]) => {
  //       this.utilsSVC.setMetas(res);
  //     },
  //     error: err => {
  //       console.error('Error obteniendo metas', err);
  //     }
  //   });
  // }



  cerrarModal() {
    this.utilsSVC.dismissModal();
  }



}

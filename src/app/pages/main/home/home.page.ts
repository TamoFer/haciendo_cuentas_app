import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf]

})
export class HomePage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarOpciones: boolean = false;



  ngOnInit() {
    const usuario = this.utilsSVC.obtenerDatosLS('user');
    if (usuario) {
      this.nombreUser = usuario.name;
      this.usuarioLogeado = true;
    }
  }

  async confirmarSignOut() {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas desloguearte?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.signOut();
          }
        }
      ]
    });

    await alert.present();
  }

  signOut() {
    this.firebaseSVC.signOut();
  }


}

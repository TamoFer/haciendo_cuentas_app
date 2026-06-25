import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';


@Component({
  selector: 'app-meses',
  templateUrl: './meses.component.html',
  styleUrls: ['./meses.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule]

})
export class MesesComponent implements OnInit {

  //importo servicios
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  constructor() { }

  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  subscripcionUser: Subscription;
  user: User;
  mes: string = '';



  ngOnInit() {

    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.mes = new Date().toLocaleDateString('es-ES', { month: 'long' });
        this.obtenerDatosUsuario(user);
      }
    });

  }

  obtenerDatosUsuario(user: User) {

    this.nombreUser = user.name;
    this.usuarioLogeado = true;
  }


  async confirmarSignOut() {
    // const alert = await this.utilsSVC.alertasCtrl.create({
    //   header: 'Cerrar sesión',
    //   message: '¿Estás seguro que deseas desloguearte?',
    //   buttons: [
    //     {
    //       text: 'Cancelar',
    //       role: 'cancel',
    //       handler: () => {
    //       }
    //     },
    //     {
    //       text: 'Salir',
    //       role: 'destructive',
    //       handler: () => {
    //         this.signOut();
    //       }
    //     }
    //   ]
    // });

    // await alert.present();
  }

  // signOut() {
  //   const path = `users/${this.user.uid}`;
  //   const data = {
  //     ... this.user,
  //     saldo_banco: this.saldo_bco,
  //     saldo_efectivo: this.saldo_efe,
  //     censurar_montos: this.mostrarSaldos
  //   };

  //   this.firebaseSVC.setDocument(path, data).then(() => {
  //     this.movimientosCuenta = [];
  //     this.firebaseSVC.signOut();
  //   })


  // }

}

import { Component, inject, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent]
})
export class GastosPage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;


  ngOnInit() {
    const usuario = this.utilsSVC.obtenerDatosLS('user');
    if (usuario) {
      this.nombreUser = usuario.name;
      this.usuarioLogeado = true;
    }
  }

  constructor(private navCtrl: NavController) { }



  retroceder() {
    this.navCtrl.back();
  }

}

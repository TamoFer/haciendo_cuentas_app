import { Component, inject, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  styleUrls: ['./ingresos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent]

})
export class IngresosPage implements OnInit {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;

  constructor(private navCtrl: NavController) { }


  ngOnInit() {
    const usuario = this.utilsSVC.obtenerDatosLS('user');
    if (usuario) {
      this.nombreUser = usuario.name;
      this.usuarioLogeado = true;
    }
  }

  retroceder() {
    this.navCtrl.back();
  }
}

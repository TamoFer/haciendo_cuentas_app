import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [IonicModule, RouterLink]
})
export class FooterComponent implements OnInit {

  utilsSV = inject(UtilsService);

  ngOnInit() { }

  async enDesarrollo() {
    const alert = await this.utilsSV.alertasCtrl.create({
      header: 'Trabajando',
      message: 'Momentaneamente esta seccion esta en desarrollo',
      buttons: ['Gracias']
    });

    await alert.present();
  }


}

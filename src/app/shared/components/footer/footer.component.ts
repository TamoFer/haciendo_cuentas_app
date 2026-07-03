import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { CambioDivisaComponent } from 'src/app/pages/main/intercambio/cambio-divisa.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [IonicModule, RouterLink, RouterLinkActive]
})
export class FooterComponent {

  utilsSvc = inject(UtilsService);

  async abrirIntercambio() {
    const modal = await this.utilsSvc.modalsCtrl.create({
      component: CambioDivisaComponent
    });
    await modal.present();
  }
}

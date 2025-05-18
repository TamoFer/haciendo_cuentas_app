import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-cambio-divisa',
  templateUrl: './cambio-divisa.component.html',
  styleUrls: ['./cambio-divisa.component.scss'],
  imports: [IonicModule, HeaderComponent, CommonModule]
})
export class CambioDivisaComponent implements OnInit {

  utilsSVC = inject(UtilsService);
  mostrarBack: boolean = true;

  ngOnInit() { }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

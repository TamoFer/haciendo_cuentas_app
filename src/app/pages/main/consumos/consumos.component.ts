import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Consumo } from 'src/app/models/consumoTarjeta.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-consumos',
  templateUrl: './consumos.component.html',
  styleUrls: ['./consumos.component.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule]
})
export class ConsumosComponent implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  subscripcionUser: Subscription;
  nombreUser: string = '';
  mostrarBack: boolean = true;
  consumos: Consumo[] = [];
  totalConsumos: number = 0;


  @Input() tarjeta: Tarjeta;


  constructor() { }

  ngOnInit() {
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.usuario = user;
        this.nombreUser = user.name;
        this.usuarioLogeado = true;
      }
    });


    this.obtenerConsumosTarjeta();
  }

  calcularTotal() {
    this.totalConsumos = this.consumos.reduce((acc, consumo) => acc + Number(String(consumo.importe_total).replace(/\./g, '').replace(',', '.')), 0);
  }

  obtenerConsumosTarjeta() {
    if (!this.tarjeta || !this.tarjeta.id) {
      console.warn('Tarjeta no válida');
      return;
    }
    const path = `users/${this.usuario.uid}/tarjetas/${this.tarjeta.id}/consumos`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Consumo[]) => {
        this.utilsSVC.setConsumos(res);
        this.consumos = res;
        this.calcularTotal();

      },
      error: err => {
        console.error('Error obteniendo consumos', err);
      }
    });
  }


  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

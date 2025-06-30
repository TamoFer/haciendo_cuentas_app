import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule, RouterLink, ReactiveFormsModule]
})
export class GastosPage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  nombreUser: string = '';
  usuarioLogeado: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  usuario = this.utilsSVC.obtenerDatosLS('user');
  totalGastos: string;
  rubros = ['Compra', 'Regalo', 'Deudas', 'Servicios'];
  busquedaPorFechas: boolean = false;
  busquedaPorOtros: boolean = false;

  filtrosFecha = new FormGroup({
    desde: new FormControl(Validators.required),
    hasta: new FormControl(Validators.required),

  });

  filtrosOtros = new FormGroup({
    rubro: new FormControl(Validators.required),
    detalle: new FormControl(Validators.required),

  });

  constructor() { }




  ngOnInit() {
    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.utilsSVC.movimientos$.subscribe(movs => {
      this.movimientosCuenta = movs.sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

    });
    this.obtenerMovimientosCuenta();
  }

  filtrarDatos() {

  }


  obtenerMovimientosCuenta() {
    const path = `users/${this.usuario.uid}/movimientos`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => {
        this.utilsSVC.setMovimientos(res);
        this.totalGastos = this.sumarTotalGastos(this.movimientosCuenta)
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
      }
    });


  }

  sumarTotalGastos(movimientos) {
    let total = 0;
    for (let movimiento of movimientos) {
      if (movimiento.genero === 'gasto') {
        total += Number(movimiento.importe)
      }
    }
    return String(total)
  }




}

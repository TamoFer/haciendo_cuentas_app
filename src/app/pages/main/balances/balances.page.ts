import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Consumo } from 'src/app/models/consumoTarjeta.model';
import { Movimiento } from 'src/app/models/movimiento.mode';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { CotizacionService } from 'src/app/services/cotizacion.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-balances',
  templateUrl: './balances.page.html',
  styleUrls: ['./balances.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, CommonModule, RouterLink]
})
export class BalancesPage implements OnInit {
  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  usuarioLogeado: boolean = false;
  usuario = this.utilsSVC.obtenerDatosLS('user');
  nombreUser: string = '';
  ingresosFijos: Movimiento[] = [];
  gastosFijos: Movimiento[] = [];
  tarjetas: Tarjeta[] = [];
  consumos: Consumo[] = [];
  consumosSubscription: Subscription;
  dolarTarjeta: number = 0;
  totalConsumosPesos: number = 0;
  totalConsumosMonedaExt: number = 0;



  constructor(private cotizacionService: CotizacionService) { }

  ngOnInit() {
    if (this.usuario) {
      this.nombreUser = this.usuario.name;
      this.usuarioLogeado = true;
    }

    this.cotizacionService.obtenerCotizacionDolar().subscribe({
      next: (cotizacion) => {
        this.dolarTarjeta = cotizacion.venta;
      },
      error: (err) => {
        console.error('Error al obtener la cotización del dólar:', err);
      }
    })

    this.utilsSVC.movimientos$.subscribe(movs => {
      this.gastosFijos = movs
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .filter(mov => mov.genero !== 'ingreso' && mov.fijo === true);
      this.ingresosFijos = movs
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .filter(mov => mov.genero === 'ingreso' && mov.fijo === true);
    });

    this.utilsSVC.tarjetas$.subscribe(tarjeta => {
      this.tarjetas = tarjeta;
    });

    this.utilsSVC.consumos$.subscribe(consumos => {
      this.consumos = consumos;
      // this.calcularTotalPesos();
      // this.calcularTotalMonedaExtranjera();
    });

    this.obtenerTarjetasUsuario();
    this.obtenerMovimientosCuenta();
    // this.obtenerConsumosTarjetas(this.tarjetas[0]);

  }

  obtenerTarjetasUsuario() {
    const path = `users/${this.usuario.uid}/tarjetas`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Tarjeta[]) => {
        this.utilsSVC.setTarjetas(res);
      },
      error: err => {
        console.error('Error obteniendo tarjetas', err);
      }
    });
  }

  obtenerMovimientosCuenta() {
    const path = `users/${this.usuario.uid}/movimientos`;

    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => {
        this.utilsSVC.setMovimientos(res);
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
      }
    });


  }


  obtenerConsumosTarjetas(tarjeta: Tarjeta) {
    console.log('tarjeta seleccionada:', tarjeta);


    const path = `users/${this.usuario.uid}/tarjetas/${tarjeta.id}/consumos`;

    this.consumosSubscription = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Consumo[]) => {
        this.utilsSVC.setConsumos(res);
        this.consumos = res;
        // if (this.consumos.length === 0) {
        // }
        this.calcularTotalPesos();
        this.calcularTotalMonedaExtranjera();

      },
      error: err => {
        console.error('Error obteniendo consumos', err);
      }
    });

  }

  calcularTotalPesos() {
    this.totalConsumosPesos = this.consumos.reduce((acc, consumo) => {
      if (consumo.moneda === 'Pesos') {
        return acc + Number(String(consumo.importe_total).replace(/\./g, '').replace(',', '.'));
      }
      return acc;
    }, 0);
  }

  calcularTotalMonedaExtranjera() {
    this.totalConsumosMonedaExt = this.consumos.reduce((acc, consumo) => {
      if (consumo.moneda === 'Dólares' || consumo.moneda === 'Euros') {
        return acc + Number(String(consumo.importe_total).replace(/\./g, '').replace(',', '.'));
      }
      return acc;
    }, 0);
  }

}

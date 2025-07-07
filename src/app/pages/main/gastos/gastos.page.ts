import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
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
  movimientosFiltrados: Movimiento[];
  usuario = this.utilsSVC.obtenerDatosLS('user');
  totalGastos: number = 0;

  dias = [7, 15, 30]


  busquedaPorFechas: boolean = false;
  busquedaPorRubro: boolean = false;
  busquedaPorDetalle: boolean = false;
  busquedaPorDias: boolean = false;


  formulario = new FormGroup({
    desde: new FormControl(null),
    hasta: new FormControl(null),
    rubro: new FormControl(null),
    detalle: new FormControl(null, Validators.minLength(1)),
    dias: new FormControl(null)
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
      ) && movs.filter(mov => mov.genero != 'ingreso');

    });
    this.obtenerMovimientosCuenta();
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

  sumarTotalGastos(movimientos) {
    let total = 0;
    for (let mov of movimientos) {
      total += Number(mov.importe.replace(/\./g, '').replace(',', '.'))
    }
    return total
  }

  filtrarPorDias(dias: number) {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() - dias);
    let total = 0;

    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      const fechaMov = new Date(mov.fecha);
      if (fechaMov >= fechaLimite) {
        total = total + Number(String(mov.importe).replace(/\./g, '').replace(',', '.'));
      }
      this.totalGastos = total;
      return fechaMov >= fechaLimite;
    });


  }

  filtrarPorFechas(desde, hasta) {
    let total = 0
    this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
      if (new Date(mov.fecha) >= new Date(desde) && new Date(mov.fecha) <= new Date(hasta)) {
        total = total + Number(String(mov.importe).replace(/\./g, '').replace(',', '.'))
      }
      this.totalGastos = total
      return new Date(mov.fecha) >= new Date(desde) && new Date(mov.fecha) <= new Date(hasta)
    }
    )
  }


  filtrarDatos(formulario: FormGroup) {
    let total = 0;
    if (formulario.get('rubro')?.value != null) {
      this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
        if (mov.rubro.toLowerCase() === formulario.value.rubro) {
          total = total + Number(String(mov.importe).replace(/\./g, '').replace(',', '.')),
            this.totalGastos = total
        }
        return mov.rubro.toLowerCase() === formulario.value.rubro
      }
      )
    } else if (formulario.get('detalle')?.value != null) {
      this.movimientosFiltrados = this.movimientosCuenta.filter(mov => {
        if (mov.detalle.toLowerCase() === formulario.value.detalle.toLowerCase()) {
          total = total + Number(String(mov.importe).replace(/\./g, '').replace(',', '.')),
            this.totalGastos = total
        }
        return mov.detalle.toLowerCase() === formulario.value.detalle.toLowerCase()
      }

      )
    } else if (formulario.get('dias')?.value != null) {
      this.filtrarPorDias(formulario.value.dias)
    } else {
      this.filtrarPorFechas(formulario.value.desde, formulario.value.hasta)
    }
  }

  limpiarFiltros() {
    this.formulario.reset();
    this.movimientosFiltrados = [];
    this.totalGastos = 0;
  }

}

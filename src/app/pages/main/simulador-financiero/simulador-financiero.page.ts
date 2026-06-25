import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoProyectado, ProyeccionMes } from 'src/app/models/gasto-proyectado.model';
import { AgregarGastoComponent } from './agregar-gasto/agregar-gasto.component';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-simulador-financiero',
  templateUrl: './simulador-financiero.page.html',
  styleUrls: ['./simulador-financiero.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, FooterComponent]
})
export class SimuladorFinancieroPage implements OnInit {

  simuladorSvc = inject(SimuladorService);
  utilsSvc = inject(UtilsService);

  ingresoMensual: number = 0;
  mesesProyeccion: number = 6;
  proyecciones: ProyeccionMes[] = [];

  gastosFijos: GastoProyectado[] = [];
  gastosTemporales: GastoProyectado[] = [];

  mostrarDetalle: boolean = false;
  mesDetalle?: ProyeccionMes;

  categoriasFijas: string[] = ['Servicios', 'Alquiler', 'Supermercado', 'Transporte', 'Seguros', 'Suscripciones', 'Otros'];
  categoriasTemporales: string[] = ['Prestamo', 'Cuota', 'Compra', 'Deuda', 'Otro'];

  ngOnInit() {}

  calcularProyeccion() {
    if (this.ingresoMensual <= 0) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un monto válido',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    this.proyecciones = this.simuladorSvc.calcularProyeccion(
      this.ingresoMensual,
      this.mesesProyeccion,
      this.gastosFijos,
      this.gastosTemporales
    );
  }

  async abrirModalGasto(tipo: 'fijo' | 'temporal') {
    const modal = await this.utilsSvc.modalsCtrl.create({
      component: AgregarGastoComponent,
      componentProps: {
        tipo,
        categorias: tipo === 'fijo' ? this.categoriasFijas : this.categoriasTemporales
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      if (tipo === 'fijo') {
        this.gastosFijos.push(data);
      } else {
        this.gastosTemporales.push(data);
      }
      this.calcularProyeccion();
    }
  }

  eliminarGastoFijo(id: string) {
    this.gastosFijos = this.gastosFijos.filter(g => g.id !== id);
    this.calcularProyeccion();
  }

  eliminarGastoTemporal(id: string) {
    this.gastosTemporales = this.gastosTemporales.filter(g => g.id !== id);
    this.calcularProyeccion();
  }

  toggleDetalle(proyeccion: ProyeccionMes) {
    if (this.mesDetalle === proyeccion) {
      this.mesDetalle = undefined;
      this.mostrarDetalle = false;
    } else {
      this.mesDetalle = proyeccion;
      this.mostrarDetalle = true;
    }
  }

  formatearMonto(monto: number): string {
    return this.simuladorSvc.formatearNumero(monto);
  }

  getTotalGastosFijos(): number {
    return this.gastosFijos.reduce((sum, g) => sum + g.importe, 0);
  }

  getTotalGastosTemporales(): number {
    return this.gastosTemporales.reduce((sum, g) => sum + g.importe, 0);
  }
}

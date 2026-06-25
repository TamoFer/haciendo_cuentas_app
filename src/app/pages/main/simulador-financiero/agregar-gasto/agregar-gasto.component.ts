import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { SimuladorService } from 'src/app/services/simulador.service';
import { GastoProyectado } from 'src/app/models/gasto-proyectado.model';

@Component({
  selector: 'app-agregar-gasto',
  templateUrl: './agregar-gasto.component.html',
  styleUrls: ['./agregar-gasto.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgregarGastoComponent implements OnInit {

  utilsSvc = inject(UtilsService);
  simuladorSvc = inject(SimuladorService);

  tipo: 'fijo' | 'temporal' = 'fijo';
  categorias: string[] = [];

  nombre: string = '';
  categoria: string = '';
  importe: number = 0;
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = '';
  cantidadCuotas: number = 0;
  detalles: string = '';

  ngOnInit() {}

  guardar() {
    if (!this.nombre.trim()) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un nombre',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    if (this.importe <= 0) {
      this.utilsSvc.presentToast({
        message: 'Ingresá un monto válido',
        duration: 2000,
        color: 'warning',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    let fechaFinDate: Date | undefined;
    if (this.tipo === 'temporal' && this.fechaFin) {
      fechaFinDate = new Date(this.fechaFin);
    } else if (this.tipo === 'temporal' && this.cantidadCuotas > 0) {
      const fin = new Date(this.fechaInicio);
      fin.setMonth(fin.getMonth() + this.cantidadCuotas - 1);
      fechaFinDate = fin;
    }

    const gasto: GastoProyectado = {
      id: this.simuladorSvc.crearId(),
      nombre: this.nombre.trim(),
      tipo: this.tipo === 'fijo' ? 'recurrente' : 'cuota',
      importe: this.importe,
      fechaInicio: new Date(this.fechaInicio),
      fechaFin: fechaFinDate,
      esFijo: this.tipo === 'fijo',
      categoria: this.categoria || 'Otros',
      detalles: this.detalles.trim()
    };

    this.utilsSvc.dismissModal(gasto);
  }

  cerrar() {
    this.utilsSvc.dismissModal();
  }
}

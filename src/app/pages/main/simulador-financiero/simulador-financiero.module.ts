import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from 'src/app/shared/shared.module';
import { SimuladorFinancieroRoutingModule } from './simulador-financiero-routing.module';
import { AgregarGastoComponent } from './agregar-gasto/agregar-gasto.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    SimuladorFinancieroRoutingModule,
    AgregarGastoComponent
  ],
})
export class SimuladorFinancieroModule { }

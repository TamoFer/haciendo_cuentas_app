import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngresosPageRoutingModule } from './ingresos-routing.module';

import { IngresosPage } from './ingresos.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IngresosPageRoutingModule,
    SharedModule
  ],
  // declarations: [IngresosPage]
})
export class IngresosPageModule { }

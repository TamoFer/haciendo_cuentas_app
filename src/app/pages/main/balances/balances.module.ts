import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BalancesPageRoutingModule } from './balances-routing.module';

import { BalancesPage } from './balances.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BalancesPageRoutingModule
  ],
  // declarations: [BalancesPage]
})
export class BalancesPageModule { }

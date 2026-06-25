import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SimuladorFinancieroPage } from './simulador-financiero.page';

const routes: Routes = [
  {
    path: '',
    component: SimuladorFinancieroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimuladorFinancieroRoutingModule { }

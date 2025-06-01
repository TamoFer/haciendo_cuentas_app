import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BalancesPage } from './balances.page';

const routes: Routes = [
  {
    path: '',
    component: BalancesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BalancesPageRoutingModule {}

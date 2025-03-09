import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecuperarPswdPage } from './recuperar-pswd.page';

const routes: Routes = [
  {
    path: '',
    component: RecuperarPswdPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecuperarPswdPageRoutingModule {}

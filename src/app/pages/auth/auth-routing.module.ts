import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthPage } from './auth.page';

const routes: Routes = [
  {
    path: '',
    component: AuthPage
  },  {
    path: 'registro-usuario',
    loadChildren: () => import('./registro-usuario/registro-usuario.module').then( m => m.RegistroUsuarioPageModule)
  },
  {
    path: 'recuperar-pswd',
    loadChildren: () => import('./recuperar-pswd/recuperar-pswd.module').then( m => m.RecuperarPswdPageModule)
  },



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule { }

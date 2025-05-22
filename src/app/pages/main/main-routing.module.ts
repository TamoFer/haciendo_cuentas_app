import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'gastos',
    loadChildren: () => import('./gastos/gastos.module').then(m => m.GastosPageModule)
  },
  {
    path: 'ingresos',
    loadChildren: () => import('./ingresos/ingresos.module').then(m => m.IngresosPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule { }

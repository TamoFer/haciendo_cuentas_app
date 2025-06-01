import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { noAuthGuard } from './guards/no-auth.guard';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthPageModule), canActivate: [noAuthGuard]
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then(m => m.MainPageModule), canActivate: [AuthGuard]
  },

  {
    path: 'home',
    loadChildren: () => import('./pages/main/home/home.module').then(m => m.HomePageModule), canActivate: [AuthGuard]
  },
  {
    path: 'gastos',
    loadChildren: () => import('./pages/main/gastos/gastos.module').then(m => m.GastosPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'ingresos',
    loadChildren: () => import('./pages/main/ingresos/ingresos.module').then(m => m.IngresosPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'tarjetas',
    loadChildren: () => import('./pages/main/tarjetas/tarjetas.module').then(m => m.TarjetasPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'balances',
    loadChildren: () => import('./pages/main/balances/balances.module').then(m => m.BalancesPageModule), canActivate: [AuthGuard]
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

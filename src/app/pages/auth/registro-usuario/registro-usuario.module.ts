import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroUsuarioPageRoutingModule } from './registro-usuario-routing.module';

import { RegistroUsuarioPage } from './registro-usuario.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroUsuarioPageRoutingModule,
    SharedModule
  ],
  // declarations: [RegistroUsuarioPage]
})
export class RegistroUsuarioPageModule { }

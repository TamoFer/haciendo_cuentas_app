import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MesesComponent } from './meses.component';

const routes: Routes = [
    {
        path: '',
        component: MesesComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MesesModuleRoutingModule { }

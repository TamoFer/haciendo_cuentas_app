import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IngresoDatosComponent } from 'src/app/shared/components/ingreso-datos/ingreso-datos.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [IonicModule, HeaderComponent, IngresoDatosComponent, ReactiveFormsModule]
})
export class AuthPage implements OnInit {

  formulario = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });



  constructor() { }

  ngOnInit() {
  }

}

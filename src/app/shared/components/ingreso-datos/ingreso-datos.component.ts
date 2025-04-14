import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-ingreso-datos',
  templateUrl: './ingreso-datos.component.html',
  styleUrls: ['./ingreso-datos.component.scss'],
  imports: [IonicModule, NgIf, ReactiveFormsModule, NgFor],
  // standalone: true
})
export class IngresoDatosComponent implements OnInit {

  contrasenia!: boolean;
  ocultarVer: boolean = true;

  @Input() control!: FormControl;
  @Input() type: string = 'text';
  @Input() label!: string;
  @Input() autocomplete!: string;
  @Input() icon!: string;
  @Input() options: string[] = [];

  constructor() { }
  ngOnInit() {
    this.type == 'password' ? this.contrasenia = true : this.contrasenia = false;
  }

  hideShowPassword() {
    this.ocultarVer = !this.ocultarVer;
    this.ocultarVer ? this.type = 'password' : this.type = 'text';

  }

}

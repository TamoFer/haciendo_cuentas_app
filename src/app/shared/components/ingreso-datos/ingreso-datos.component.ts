import { NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-ingreso-datos',
  templateUrl: './ingreso-datos.component.html',
  styleUrls: ['./ingreso-datos.component.scss'],
  imports: [IonicModule, NgIf, ReactiveFormsModule],
  // standalone: true
})
export class IngresoDatosComponent implements OnInit {

  @Input() control!: FormControl;
  @Input() type!: string;
  @Input() label!: string;
  @Input() autocomplete!: string;
  @Input() icon!: string;
  // @Input() placeholder!: string;


  constructor() { }



  ngOnInit() { }

}

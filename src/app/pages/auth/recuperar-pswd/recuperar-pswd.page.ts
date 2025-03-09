import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-recuperar-pswd',
  templateUrl: './recuperar-pswd.page.html',
  styleUrls: ['./recuperar-pswd.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ],
  standalone: true
})
export class RecuperarPswdPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

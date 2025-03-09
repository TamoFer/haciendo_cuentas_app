import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  imports: [IonicModule],
  standalone: true
})
export class LogoComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}

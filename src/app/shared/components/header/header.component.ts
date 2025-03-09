import { Component, Input, input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonicModule],
  standalone: true
})
export class HeaderComponent implements OnInit {

  @Input() title!: string;

  constructor() { }

  ngOnInit() { }

}

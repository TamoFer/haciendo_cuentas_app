import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonicModule, NgIf],
  standalone: true
})
export class HeaderComponent implements OnInit {
  @Input() title!: string;
  @Input() mostrarVolver: boolean = false;
  @Output() volverAccion = new EventEmitter<void>();
  @Input() isModal!: boolean;

  ngOnInit() { }

  volver() {
    this.volverAccion.emit();
  }
}

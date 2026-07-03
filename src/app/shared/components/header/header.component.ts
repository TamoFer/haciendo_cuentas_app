import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';

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

  utilsSVC = inject(UtilsService);
  firebaseSVC = inject(FirebaseService);

  dropdownOpen = false;
  user: User | null = null;

  ngOnInit() {
    this.user = this.utilsSVC.obtenerDatosLS('user');
  }

  get iniciales(): string {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .map(p => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  cerrarDropdown() {
    this.dropdownOpen = false;
  }

  configuracion() {
    this.cerrarDropdown();
  }

  async salir() {
    this.cerrarDropdown();
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => this.firebaseSVC.signOut()
        }
      ]
    });
    await alert.present();
  }

  volver() {
    this.volverAccion.emit();
  }
}

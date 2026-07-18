import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActionSheetController, ModalController, IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { ConfiguracionComponent } from 'src/app/pages/main/configuracion/configuracion.component';

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
  private actionSheetCtrl = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);

  dropdownOpen = false;
  user: User | null = null;
  cerrandoSesion = false;

  ngOnInit() {
    this.utilsSVC.user$.subscribe(user => {
      this.user = user;
    });
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

  async configuracion() {
    this.cerrarDropdown();
    const modal = await this.modalCtrl.create({
      component: ConfiguracionComponent,
      cssClass: 'modal-fullscreen'
    });
    await modal.present();
  }

  async salir() {
    if (this.cerrandoSesion) return;
    this.cerrandoSesion = true;
    this.cerrarDropdown();

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Cerrar sesión',
      subHeader: '¿Estás seguro que deseas salir?',
      buttons: [
        {
          text: 'Salir',
          role: 'destructive',
          data: { action: 'logout' }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();

    const { data } = await actionSheet.onDidDismiss();
    this.cerrandoSesion = false;
    if (data?.action === 'logout') {
      this.firebaseSVC.signOut();
    }
  }

  volver() {
    this.volverAccion.emit();
  }
}

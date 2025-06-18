import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { MaskitoOptions, MaskitoElementPredicate } from '@maskito/core';
import { MaskitoDirective } from '@maskito/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';


@Component({
  selector: 'app-cambio-divisa',
  templateUrl: './cambio-divisa.component.html',
  styleUrls: ['./cambio-divisa.component.scss'],
  imports: [IonicModule, HeaderComponent, CommonModule, MaskitoDirective, ReactiveFormsModule, FooterComponent]
})
export class CambioDivisaComponent implements OnInit {

  utilsSVC = inject(UtilsService);
  mostrarBack: boolean = true;

  readonly cardMask: MaskitoOptions = {
    mask: [
      ...Array(4).fill(/\d/),
    ],
  };

  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();

  formulario = new FormGroup({
    efectivo: new FormControl(null, [Validators.required, Validators.minLength(1)]),
    digital: new FormControl(null, [Validators.required, Validators.minLength(1)])
  });

  async submit() {

  }


  ngOnInit() { }

  cerrarModal() {
    this.utilsSVC.dismissModal();
  }

}

import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent]

})
export class HomePage implements OnInit {

  firebaseSVC = inject(FirebaseService)
  utilsSVC = inject(UtilsService)

  ngOnInit() {
  }

  signOut() {
    this.firebaseSVC.signOut();
  }


}

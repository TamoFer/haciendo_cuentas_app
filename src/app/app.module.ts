import { NgModule, LOCALE_ID, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router, RouteReuseStrategy } from '@angular/router';
import { AlertController, IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// 🔥 Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { CommonModule, registerLocaleData } from '@angular/common';

// 🌎 Locale imports
import localeEsAR from '@angular/common/locales/es-AR';
import { FirebaseService } from './services/firebase.service';
registerLocaleData(localeEsAR); // <-- Esto registra el locale
import { SplashScreen } from '@capacitor/splash-screen';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    IonicModule.forRoot({ mode: 'ios' }),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFireModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // 👇 Estos son los providers de Firebase modular
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),

    // 👇 Este es el locale por defecto de toda la app
    { provide: LOCALE_ID, useValue: 'es-AR' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

  private backButtonPressedOnce = false;
  private backButtonTimer: any;
  firebaseSVC = inject(FirebaseService);


  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private router: Router,
    // private location: Location
  ) {
    this.initializeApp();
    this.showSplash();
  }

  async showSplash() {
    await SplashScreen.show({
      autoHide: true,
      showDuration: 2000,
    })
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.handleBackButton();
    });
  }

  handleBackButton() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      const currentUrl = this.router.url;

      if (currentUrl === '/home') {
        // Estás en home → alerta de cerrar sesión con doble toque
        if (this.backButtonPressedOnce) {
          clearTimeout(this.backButtonTimer);
          this.backButtonPressedOnce = false;
          this.presentLogoutConfirm();
        } else {
          this.backButtonPressedOnce = true;
          this.backButtonTimer = setTimeout(() => {
            this.backButtonPressedOnce = false;
          }, 2000);
        }
      } else {
        // Estás en otra página → ir a /home
        this.router.navigate(['/home']);
      }
    });
  }

  async presentLogoutConfirm() {

    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Querés cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sí',
          handler: () => {
            // Aquí ponés tu función de logout
            this.firebaseSVC.signOut();
            console.log('Usuario deslogueado');
            this.router.navigate(['/login']);
          },
        },
      ],
    });

    await alert.present();
  }
}

import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService {
  private timeoutId: any;
  private readonly idleTime = 10 * 60 * 1000; // 5 minutos

  constructor(private router: Router, private ngZone: NgZone) { }

  startWatching() {
    this.resetTimer();

    const userEvents = ['click', 'mousemove', 'mousedown', 'touchstart', 'keypress', 'scroll'];

    userEvents.forEach(event => {
      window.addEventListener(event, () => this.resetTimer());
    });
  }

  private resetTimer() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => this.logout());
    }, this.idleTime);
  }

  private logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log('Sesión cerrada por inactividad');
      this.router.navigate(['/auth']);
    });
  }

  stopWatching() {
    clearTimeout(this.timeoutId);
  }
}

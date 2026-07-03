import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Movimiento } from 'src/app/models/movimiento.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { User } from 'src/app/models/user.model';
import { Subscription } from 'rxjs';
import { IdleTimeoutService } from 'src/app/services/idle-timeout.service';
import { Cambio } from 'src/app/models/cambio';

interface MovimientoItem {
  tipoMov: 'gasto' | 'ingreso' | 'cambio';
  concepto: string;
  importe: string;
  fecha: string;
  icono: string;
  rawFecha: Date;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule]
})
export class HomePage implements OnInit, OnDestroy {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);

  nombreUser: string = '';
  saldo_bco: number = 0;
  saldo_efe: number = 0;
  saldo_total: number = 0;
  hora: Date = new Date();

  usuarioLogeado: boolean = false;
  mostrarSaldos: boolean = false;
  movimientosCuenta: Movimiento[] = [];
  movimientosCambios: Cambio[] = [];
  user!: User;
  subscripcionUser!: Subscription;

  private opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  fechaFormateada = new Intl.DateTimeFormat('es-AR', this.opciones).format(this.hora);

  constructor(private idleService: IdleTimeoutService) {
    this.idleService.startWatching();
  }

  ngOnInit() {
    this.subscripcionUser = this.utilsSVC.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.obtenerDatosUsuario(user);
      }
    });

    this.utilsSVC.movimientos$.subscribe(movs => {
      this.movimientosCuenta = movs.sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    });

    this.utilsSVC.cambios$.subscribe(movs => {
      this.movimientosCambios = movs.sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    });

    this.obtenerMovimientosCuenta();
    this.obtenerMovimientosCambios();
  }

  get ultimosMovimientos(): MovimientoItem[] {
    const items: MovimientoItem[] = [];

    for (const m of this.movimientosCuenta) {
      const fecha = new Date(m.fecha);
      items.push({
        tipoMov: m.genero === 'gasto' ? 'gasto' : 'ingreso',
        concepto: m.rubro || m.detalle || '',
        importe: m.genero === 'gasto'
          ? `- $${Number(m.importe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
          : `+ $${Number(m.importe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        icono: m.tipo === 'Efectivo' ? 'cash-outline' : 'card-outline',
        rawFecha: fecha
      });
    }

    for (const c of this.movimientosCambios) {
      const fecha = new Date(c.fecha);
      items.push({
        tipoMov: 'cambio',
        concepto: c.desde === 'efectivo' ? 'Depósito a banco' : 'Retiro de efectivo',
        importe: `$${c.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        icono: 'swap-horizontal-outline',
        rawFecha: fecha
      });
    }

    return items
      .sort((a, b) => b.rawFecha.getTime() - a.rawFecha.getTime())
      .slice(0, 6);
  }

  obtenerDatosUsuario(user: User) {
    this.nombreUser = user.name;
    this.saldo_bco = user?.saldo_banco || 0;
    this.saldo_efe = user?.saldo_efectivo || 0;
    this.saldo_total = this.saldo_bco + this.saldo_efe;
    this.usuarioLogeado = true;
    this.mostrarSaldos = user.censurar_montos;
    this.obtenerMovimientosCuenta();
    this.obtenerMovimientosCambios();
  }

  obtenerMovimientosCuenta() {
    const path = `users/${this.user.uid}/movimientos`;
    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => this.utilsSVC.setMovimientos(res),
      error: err => console.error('Error obteniendo movimientos', err)
    });
  }

  obtenerMovimientosCambios() {
    const path = `users/${this.user.uid}/cambios`;
    this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Cambio[]) => this.utilsSVC.setCambios(res),
      error: err => console.error('Error obteniendo cambios', err)
    });
  }

  ngOnDestroy() {
    this.subscripcionUser?.unsubscribe();
  }
}

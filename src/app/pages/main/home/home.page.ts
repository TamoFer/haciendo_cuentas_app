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

  ultimosMovimientos: MovimientoItem[] = [];

  // Mes proyectado
  diasRestantesMes: number = 0;
  gastoDiario: number = 0;
  nombreMesActual: string = '';

  private subs: Subscription[] = [];
  private fechaFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  fechaFormateada = this.fechaFormatter.format(this.hora);

  constructor(private idleService: IdleTimeoutService) {
    this.idleService.startWatching();
  }

  ngOnInit() {
    const subUser = this.utilsSVC.user$.subscribe((user) => {
      if (!user) return;
      this.user = user;
      this.obtenerDatosUsuario(user);
    });
    this.subs.push(subUser);

    const subMovs = this.utilsSVC.movimientos$.subscribe(movs => {
      this.movimientosCuenta = movs;
      this.recalcUltimosMov();
    });
    this.subs.push(subMovs);

    const subCambios = this.utilsSVC.cambios$.subscribe(movs => {
      this.movimientosCambios = movs;
      this.recalcUltimosMov();
    });
    this.subs.push(subCambios);
  }

  obtenerDatosUsuario(user: User) {
    this.nombreUser = user.name;
    this.saldo_bco = user?.saldo_banco || 0;
    this.saldo_efe = user?.saldo_efectivo || 0;
    this.saldo_total = this.saldo_bco + this.saldo_efe;
    this.usuarioLogeado = true;
    this.mostrarSaldos = user.censurar_montos;
    this.calcularMesProyectado();

    if (!this.movimientosCuenta.length) {
      this.obtenerMovimientosCuenta();
    }
    if (!this.movimientosCambios.length) {
      this.obtenerMovimientosCambios();
    }
  }

  private recalcUltimosMov() {
    const items: MovimientoItem[] = [];

    for (const m of this.movimientosCuenta) {
      const fecha = new Date(m.fecha);
      const montoStr = this.utilsSVC.formatARS(m.importe);
      const esGasto = m.genero === 'gasto';
      items.push({
        tipoMov: esGasto ? 'gasto' : 'ingreso',
        concepto: m.rubro || m.detalle || '',
        importe: esGasto ? `- ${montoStr}` : `+ ${montoStr}`,
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
        importe: this.utilsSVC.formatARS(c.importe),
        fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        icono: 'swap-horizontal-outline',
        rawFecha: fecha
      });
    }

    this.ultimosMovimientos = items
      .sort((a, b) => b.rawFecha.getTime() - a.rawFecha.getTime())
      .slice(0, 5);
  }

  obtenerMovimientosCuenta() {
    const path = `users/${this.user.uid}/movimientos`;
    const sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Movimiento[]) => this.utilsSVC.setMovimientos(res),
      error: err => console.error('Error obteniendo movimientos', err)
    });
    this.subs.push(sub);
  }

  obtenerMovimientosCambios() {
    const path = `users/${this.user.uid}/cambios`;
    const sub = this.firebaseSVC.getCollectionData(path).subscribe({
      next: (res: Cambio[]) => this.utilsSVC.setCambios(res),
      error: err => console.error('Error obteniendo cambios', err)
    });
    this.subs.push(sub);
  }

  calcularMesProyectado() {
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    this.diasRestantesMes = ultimoDiaMes - hoy.getDate();
    this.nombreMesActual = hoy.toLocaleDateString('es-AR', { month: 'long' });

    if (this.diasRestantesMes <= 0) {
      // Último día del mes: gasta todo lo que queda hoy
      this.diasRestantesMes = 1;
    }

    if (this.saldo_total > 0) {
      this.gastoDiario = this.saldo_total / this.diasRestantesMes;
    } else {
      this.gastoDiario = 0;
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s?.unsubscribe());
  }
}
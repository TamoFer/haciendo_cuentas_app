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
      const montoStr = this.formatARS(m.importe);
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
        importe: this.formatARS(c.importe),
        fecha: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        icono: 'swap-horizontal-outline',
        rawFecha: fecha
      });
    }

    this.ultimosMovimientos = items
      .sort((a, b) => b.rawFecha.getTime() - a.rawFecha.getTime())
      .slice(0, 5);
  }

  // Formatea un importe a moneda AR: separador de miles con "." y decimal con ",".
  // Acepta number, string numérico ("10883"), o string enmascarado AR ("10.883,00").
  private formatARS(value: number | string): string {
    const n = this.parseARS(value);
    const [enteroRaw, decimalRaw] = Math.abs(n).toFixed(2).split('.');
    const entero = enteroRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const signo = n < 0 ? '-' : '';
    return `${signo}$${entero},${decimalRaw}`;
  }

  // Convierte cualquier entrada a number. Datos guardados con maskito AR:
  // "10.883,00" (con decimal), "10.883" (entero, el "." es separador de miles),
  // "10883" (sin formato), o number. También tolera EN ("10,883.00").
  private parseARS(value: number | string): number {
    if (value == null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let s = String(value).trim().replace(/[^0-9.,-]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
      // Si "," está después de "." → AR: "." miles, "," decimal.
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        return Number(s.replace(/\./g, '').replace(',', '.'));
      }
      // EN: "," miles, "." decimal.
      return Number(s.replace(/,/g, ''));
    }
    if (hasDot) {
      // Solo "." sin ",": en contexto AR puede ser miles ("10.883") o decimal ("10.5").
      const dots = s.split('.');
      if (dots.length > 2) {
        // Varios "." → miles. "1.000.000"
        return Number(s.replace(/\./g, ''));
      }
      // Un solo ".": si la parte decimal tiene 3 dígitos → miles. Si 1-2 → decimal.
      const decPart = dots[1] || '';
      if (decPart.length === 3) {
        return Number(s.replace('.', ''));
      }
      return Number(s);
    }
    if (hasComma) {
      // Solo "," sin ".": en AR es decimal ("10883,00").
      return Number(s.replace(',', '.'));
    }
    return Number(s);
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
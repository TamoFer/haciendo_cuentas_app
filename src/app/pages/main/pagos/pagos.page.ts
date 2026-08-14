import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { SimuladorService } from 'src/app/services/simulador.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

interface ItemPago {
  id: string;
  nombre: string;
  categoria: string;
  importe: number;
  cuotaInfo?: string;
  pagado: boolean;
  tarjetaId?: string;
  tarjetaNombre?: string;
  gastoOriginal: GastoSimulador;
}

interface TarjetaGrupo {
  tarjeta: Tarjeta | null;
  items: ItemPago[];
  total: number;
  pagado: number;
  expandido: boolean;
}

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
  imports: [IonicModule, HeaderComponent, FooterComponent, NgIf, NgFor, CommonModule]
})
export class PagosPage implements OnInit {

  firebaseSVC = inject(FirebaseService);
  utilsSVC = inject(UtilsService);
  simuladorSvc = inject(SimuladorService);

  mesActual: string = '';
  nombreMes: string = '';
  mesOffset = 0;

  consumosMensuales: ItemPago[] = [];
  consumosSinTarjeta: ItemPago[] = [];
  tarjetasGrupos: TarjetaGrupo[] = [];

  totalMensuales = 0;
  pagadoMensuales = 0;
  totalCuotas = 0;
  pagadoCuotas = 0;
  totalSinTarjeta = 0;

  expandirMensuales = true;
  expandirSinTarjeta = true;

  tarjetas: Tarjeta[] = [];
  private usuario = this.utilsSVC.obtenerDatosLS('user');

  ngOnInit() {
    this.calcularMes();
    this.cargarTarjetasYgastos();
  }

  private calcularMes() {
    const hoy = new Date();
    const fechaRef = new Date(hoy.getFullYear(), hoy.getMonth() + this.mesOffset, 1);
    this.mesActual = `${fechaRef.getFullYear()}-${String(fechaRef.getMonth() + 1).padStart(2, '0')}`;
    this.nombreMes = fechaRef.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  mesAnterior() {
    this.mesOffset--;
    this.calcularMes();
    this.cargarGastos();
  }

  mesSiguiente() {
    this.mesOffset++;
    this.calcularMes();
    this.cargarGastos();
  }

  toggleMensuales() { this.expandirMensuales = !this.expandirMensuales; }
  toggleSinTarjeta() { this.expandirSinTarjeta = !this.expandirSinTarjeta; }
  toggleTarjetaGrupo(grupo: TarjetaGrupo) { grupo.expandido = !grupo.expandido; }

  private parseImporte(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let s = String(value).trim().replace(/[^0-9.,-]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        return Number(s.replace(/\./g, '').replace(',', '.'));
      }
      return Number(s.replace(/,/g, ''));
    }
    if (hasDot) {
      const dots = s.split('.');
      if (dots.length > 2) return Number(s.replace(/\./g, ''));
      const decPart = dots[1] || '';
      if (decPart.length === 3) return Number(s.replace('.', ''));
      return Number(s);
    }
    if (hasComma) return Number(s.replace(',', '.'));
    return Number(s);
  }

  private estaPagado(g: GastoSimulador): boolean {
    return !!g.pagado && g.mesPagado === this.mesActual;
  }

  private cargarTarjetasYgastos() {
    if (!this.usuario) return;
    const pathTarjetas = `users/${this.usuario.uid}/tarjetas`;
    this.firebaseSVC.getCollectionData(pathTarjetas).subscribe({
      next: (tarjetas: Tarjeta[]) => {
        this.utilsSVC.setTarjetas(tarjetas);
        this.tarjetas = tarjetas || [];
        this.cargarGastos();
      },
      error: err => {
        console.error('Error obteniendo tarjetas', err);
        this.cargarGastos();
      }
    });
  }

  private async cargarGastos() {
    if (!this.usuario) return;
    try {
      const gastos = await this.firebaseSVC.getGastosSimulador(this.usuario.uid) as GastoSimulador[];
      const todos = gastos || [];
      this.utilsSVC.setGastosSimulador(todos);

      const fijos = todos.filter(g => g.tipo === 'fijo');
      const temporales = todos.filter(g => g.tipo === 'temporal');

      this.consumosMensuales = fijos.map(g => ({
        id: g.id,
        nombre: g.nombre || g.categoria || 'Consumo mensual',
        categoria: g.categoria || '',
        importe: this.parseImporte(g.importe),
        pagado: this.estaPagado(g),
        gastoOriginal: g
      }));

      const cuotasItems: ItemPago[] = [];

      for (const g of temporales) {
        const tarjeta = g.tarjetaId ? this.tarjetas.find(t => t.id === g.tarjetaId) || null : null;
        const fechaCierreDia = this.getFechaCierreDia(tarjeta);
        const evalResult = this.evaluarGastoEnMes(g, fechaCierreDia);

        if (!evalResult.activo) continue;

        cuotasItems.push({
          id: g.id,
          nombre: g.nombre || g.categoria || 'Consumo en cuotas',
          categoria: g.categoria || '',
          importe: this.parseImporte(g.importe),
          cuotaInfo: evalResult.cuotaInfo,
          pagado: this.estaPagado(g),
          tarjetaId: g.tarjetaId,
          tarjetaNombre: g.tarjetaNombre,
          gastoOriginal: g
        });
      }

      this.consumosSinTarjeta = cuotasItems.filter(i => !i.tarjetaId);

      const tarjetasConItems: TarjetaGrupo[] = this.tarjetas
        .map(t => {
          const items = cuotasItems.filter(i => i.tarjetaId === t.id);
          return {
            tarjeta: t,
            items,
            total: items.reduce((s, i) => s + i.importe, 0),
            pagado: items.filter(i => i.pagado).reduce((s, i) => s + i.importe, 0),
            expandido: items.length > 0
          };
        })
        .filter(g => g.items.length > 0);

      this.tarjetasGrupos = tarjetasConItems;
      this.recalcTotales();
    } catch (err) {
      console.error('Error obteniendo gastos del simulador', err);
    }
  }

  private getFechaCierreDia(tarjeta: Tarjeta | null): number | null {
    if (!tarjeta || !tarjeta.fecha_cierre) return null;
    const f = tarjeta.fecha_cierre;
    if (f && typeof (f as any).toDate === 'function') {
      return (f as any).toDate().getDate();
    } else if (f instanceof Date) {
      return f.getDate();
    } else {
      const str = String(f as any);
      const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
      return isNaN(d.getTime()) ? null : d.getDate();
    }
  }

  private evaluarGastoEnMes(g: GastoSimulador, fechaCierreDia: number | null): { activo: boolean, cuotaInfo: string | null } {
    const inicio = this.simuladorSvc.safeParseDate(g.fechaInicio);
    if (!inicio) return { activo: false, cuotaInfo: null };

    const hoy = new Date();
    const fechaRef = new Date(hoy.getFullYear(), hoy.getMonth() + this.mesOffset, 1);

    let mesInicioEfectivo: Date;
    if (fechaCierreDia && fechaCierreDia > 0) {
      if (inicio.getDate() <= fechaCierreDia) {
        mesInicioEfectivo = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
      } else {
        mesInicioEfectivo = new Date(inicio.getFullYear(), inicio.getMonth() + 2, 1);
      }
    } else {
      mesInicioEfectivo = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    }

    const fechaFin = g.fechaFin ? this.simuladorSvc.safeParseDate(g.fechaFin) : null;
    let mesFinEfectivo: Date | null = null;
    if (fechaFin) {
      if (fechaCierreDia && fechaCierreDia > 0) {
        if (inicio.getDate() <= fechaCierreDia) {
          mesFinEfectivo = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
        } else {
          mesFinEfectivo = new Date(fechaFin.getFullYear(), fechaFin.getMonth() + 1, 1);
        }
      } else {
        mesFinEfectivo = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
      }
    }

    const mesProyeccion = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1);

    if (mesProyeccion < mesInicioEfectivo) return { activo: false, cuotaInfo: null };
    if (mesFinEfectivo && mesProyeccion > mesFinEfectivo) return { activo: false, cuotaInfo: null };

    if (!g.cantidadCuotas || g.cantidadCuotas <= 1) {
      return { activo: true, cuotaInfo: null };
    }

    const mesesDiff = (mesProyeccion.getFullYear() - mesInicioEfectivo.getFullYear()) * 12 +
      (mesProyeccion.getMonth() - mesInicioEfectivo.getMonth());

    if (mesesDiff < 0) return { activo: false, cuotaInfo: null };

    const cuotaActual = Math.min(mesesDiff + 1, g.cantidadCuotas);
    if (cuotaActual > g.cantidadCuotas) return { activo: false, cuotaInfo: null };

    return { activo: true, cuotaInfo: `Cuota ${cuotaActual} de ${g.cantidadCuotas}` };
  }

  private recalcTotales() {
    this.totalMensuales = this.consumosMensuales.reduce((s, i) => s + i.importe, 0);
    this.pagadoMensuales = this.consumosMensuales.filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);

    this.totalSinTarjeta = this.consumosSinTarjeta.reduce((s, i) => s + i.importe, 0);

    this.totalCuotas = this.tarjetasGrupos.reduce((s, g) => s + g.total, 0) + this.totalSinTarjeta;
    this.pagadoCuotas = this.tarjetasGrupos.reduce((s, g) => s + g.pagado, 0) +
      this.consumosSinTarjeta.filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
  }

  async asociarTarjeta(item: ItemPago, tarjetaId: string) {
    if (!tarjetaId) return;
    const tarjeta = this.tarjetas.find(t => t.id === tarjetaId);
    if (!tarjeta) return;

    const path = `users/${this.usuario.uid}/gastosSimulador/${item.id}`;
    const data = {
      tarjetaId: tarjeta.id,
      tarjetaNombre: `${tarjeta.banco} ${tarjeta.tarjeta} ${tarjeta.digitos}`
    };

    try {
      await this.firebaseSVC.updateDocument(path, data);
      this.utilsSVC.presentToast({
        message: 'Tarjeta asociada correctamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.cargarGastos();
    } catch (err) {
      console.error('Error asociando tarjeta', err);
      this.utilsSVC.presentToast({
        message: 'No se pudo asociar la tarjeta',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }
  }

  async togglePagado(item: ItemPago) {
    const nuevoEstado = !item.pagado;
    item.pagado = nuevoEstado;
    this.recalcTotales();

    const path = `users/${this.usuario.uid}/gastosSimulador/${item.id}`;
    const data = {
      pagado: nuevoEstado,
      mesPagado: nuevoEstado ? this.mesActual : null
    };

    try {
      await this.firebaseSVC.updateDocument(path, data);
      this.utilsSVC.presentToast({
        message: nuevoEstado ? 'Marcado como pagado' : 'Marcado como pendiente',
        duration: 1200,
        color: nuevoEstado ? 'success' : 'medium',
        position: 'middle',
        icon: nuevoEstado ? 'checkmark-circle-outline' : 'ellipse-outline'
      });
    } catch (err) {
      console.error('Error actualizando pago', err);
      item.pagado = !nuevoEstado;
      this.recalcTotales();
      this.utilsSVC.presentToast({
        message: 'No se pudo actualizar el estado',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }
  }

  getColorBanco(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return '#c8102e';
      case 'bbva': return '#0033a0';
      case 'galicia': return '#ff6f00';
      default: return '#4a5568';
    }
  }

  getColorBancoGradient(banco: string): string {
    switch (banco.toLowerCase()) {
      case 'santander': return 'linear-gradient(135deg, #ec1c24 0%, #c8102e 50%, #a00d23 100%)';
      case 'bbva': return 'linear-gradient(135deg, #0066ff 0%, #0033a0 50%, #00267d 100%)';
      case 'galicia': return 'linear-gradient(135deg, #ff8f00 0%, #ff6f00 50%, #e65100 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4a5568 50%, #374151 100%)';
    }
  }
}
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

interface ItemPago {
  id: string;
  nombre: string;
  categoria: string;
  importe: number;
  cuotaInfo?: string;
  pagado: boolean;
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

  mesActual: string = '';
  nombreMes: string = '';

  consumosMensuales: ItemPago[] = [];
  consumosCuotas: ItemPago[] = [];

  totalMensuales = 0;
  totalCuotas = 0;
  pagadoMensuales = 0;
  pagadoCuotas = 0;

  expandirMensuales = true;
  expandirCuotas = true;

  private usuario = this.utilsSVC.obtenerDatosLS('user');

  ngOnInit() {
    const hoy = new Date();
    this.mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    this.nombreMes = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    this.cargarGastos();
  }

  toggleMensuales() { this.expandirMensuales = !this.expandirMensuales; }
  toggleCuotas() { this.expandirCuotas = !this.expandirCuotas; }

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

  private async cargarGastos() {
    if (!this.usuario) return;
    try {
      const gastos = await this.firebaseSVC.getGastosSimulador(this.usuario.uid) as GastoSimulador[];
      const todos = gastos || [];

      const fijos = todos.filter(g => g.tipo === 'fijo');
      const temporales = todos.filter(g => g.tipo === 'temporal');

      this.consumosMensuales = fijos.map(g => ({
        id: g.id,
        nombre: g.nombre || g.categoria || 'Consumo mensual',
        categoria: g.categoria || '',
        importe: this.parseImporte(g.importe),
        pagado: this.estaPagado(g)
      }));

      this.consumosCuotas = temporales
        .map(g => ({
          id: g.id,
          nombre: g.nombre || g.categoria || 'Consumo en cuotas',
          categoria: g.categoria || '',
          importe: this.parseImporte(g.importe),
          cuotaInfo: this.calcularCuotaInfo(g),
          pagado: this.estaPagado(g)
        }))
        .filter(i => !!i.cuotaInfo);

      this.recalcTotales();
    } catch (err) {
      console.error('Error obteniendo gastos del simulador', err);
    }
  }

  private calcularCuotaInfo(g: GastoSimulador): string | null {
    if (!g.cantidadCuotas || g.cantidadCuotas <= 1) return null;
    if (!g.fechaInicio) return null;

    const inicio = new Date(g.fechaInicio);
    const hoy = new Date();

    // Número de cuota que corresponde al mes actual (basado en fechaInicio).
    const cuotaActual =
      (hoy.getFullYear() - inicio.getFullYear()) * 12 +
      (hoy.getMonth() - inicio.getMonth()) + 1;

    // Fuera de rango: todavía no empezó o ya terminó.
    if (cuotaActual < 1) return null;
    if (cuotaActual > g.cantidadCuotas) return null;

    return `Cuota ${cuotaActual} de ${g.cantidadCuotas}`;
  }

  private recalcTotales() {
    this.totalMensuales = this.consumosMensuales.reduce((s, i) => s + i.importe, 0);
    this.totalCuotas = this.consumosCuotas.reduce((s, i) => s + i.importe, 0);
    this.pagadoMensuales = this.consumosMensuales.filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
    this.pagadoCuotas = this.consumosCuotas.filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
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
}
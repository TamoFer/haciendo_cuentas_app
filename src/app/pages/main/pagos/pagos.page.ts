import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GastoSimulador } from 'src/app/models/gasto-simulador.model';
import { Tarjeta } from 'src/app/models/tarjeta.model';
import { Movimiento } from 'src/app/models/movimiento.model';
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

      const cuotasItems = temporales
        .map(g => ({
          id: g.id,
          nombre: g.nombre || g.categoria || 'Consumo en cuotas',
          categoria: g.categoria || '',
          importe: this.parseImporte(g.importe),
          cuotaInfo: this.calcularCuotaInfo(g),
          pagado: this.estaPagado(g),
          tarjetaId: g.tarjetaId,
          tarjetaNombre: g.tarjetaNombre,
          gastoOriginal: g
        }))
        .filter(i => !!i.cuotaInfo);

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

  private calcularCuotaInfo(g: GastoSimulador): string | null {
    if (!g.cantidadCuotas || g.cantidadCuotas <= 1) return null;
    if (!g.fechaInicio) return null;

    const inicio = new Date(g.fechaInicio);
    const fechaRef = new Date();
    if (this.mesOffset !== 0) {
      const hoy = new Date();
      fechaRef.setFullYear(hoy.getFullYear(), hoy.getMonth() + this.mesOffset, 15);
    }

    const cuotaActual =
      (fechaRef.getFullYear() - inicio.getFullYear()) * 12 +
      (fechaRef.getMonth() - inicio.getMonth()) + 1;

    if (cuotaActual < 1) return null;
    if (cuotaActual > g.cantidadCuotas) return null;

    return `Cuota ${cuotaActual} de ${g.cantidadCuotas}`;
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

      if (nuevoEstado) {
        await this.confirmarPago(item);
      } else {
        this.utilsSVC.presentToast({
          message: 'Marcado como pendiente',
          duration: 1200,
          color: 'medium',
          position: 'middle',
          icon: 'ellipse-outline'
        });
      }
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

  private async confirmarPago(item: ItemPago) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Confirmar pago',
      message: `¿Cómo se pagó "${item.nombre}"?`,
      inputs: [
        { name: 'metodo', type: 'radio', label: 'Efectivo', value: 'Efectivo', checked: true },
        { name: 'metodo', type: 'radio', label: 'Banco', value: 'Banco' },
        { name: 'metodo', type: 'radio', label: 'Ambos', value: 'Ambos' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async (metodo: string) => {
            if (metodo === 'Ambos') {
              this.pedidoMontoMixto(item);
            } else {
              this.registrarPagoMovimiento(item, metodo, item.importe, 0);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async pedidoMontoMixto(item: ItemPago) {
    const alert = await this.utilsSVC.alertasCtrl.create({
      header: 'Pago mixto',
      message: `Total: $${item.importe.toLocaleString('es-AR')}`,
      inputs: [
        { name: 'efectivo', type: 'number', placeholder: 'Monto en efectivo' },
        { name: 'banco', type: 'number', placeholder: 'Monto en banco' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (data: { efectivo: number; banco: number }) => {
            const efectivo = Number(data.efectivo) || 0;
            const banco = Number(data.banco) || 0;
            if (efectivo + banco !== item.importe) {
              this.utilsSVC.presentToast({
                message: `Los montos deben sumar $${item.importe}`,
                duration: 2500,
                color: 'danger',
                position: 'middle',
                icon: 'alert-circle-outline'
              });
              return false;
            }
            this.registrarPagoMovimiento(item, 'Ambos', efectivo, banco);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async registrarPagoMovimiento(item: ItemPago, metodo: string, efectivo: number, banco: number) {
    const path = `users/${this.usuario.uid}/movimientos`;
    const movimiento: Movimiento = {
      id: this.firebaseSVC.crearId(),
      fecha: new Date(),
      importe: item.importe,
      detalle: item.nombre,
      rubro: item.categoria || 'Otros',
      tipo: 'gasto',
      genero: 'gasto',
      pagado: true,
      mesPagado: this.mesActual
    };

    try {
      await this.firebaseSVC.addDocument(path, movimiento);
      this.utilsSVC.agregarMovimiento(movimiento);
      await this.actualizarSaldos(metodo, efectivo, banco);
      this.utilsSVC.presentToast({
        message: 'Pago registrado correctamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    } catch (err) {
      console.error('Error registrando pago', err);
      this.utilsSVC.presentToast({
        message: 'No se pudo registrar el pago',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }
  }

  private async actualizarSaldos(metodo: string, efectivo: number, banco: number) {
    if (!this.usuario) return;
    const user = this.utilsSVC.obtenerDatosLS('user');
    if (!user) return;

    let nuevoSaldoBco = user.saldo_banco || 0;
    let nuevoSaldoEfe = user.saldo_efectivo || 0;

    if (metodo === 'Efectivo') {
      nuevoSaldoEfe -= efectivo;
    } else if (metodo === 'Banco') {
      nuevoSaldoBco -= banco;
    } else {
      nuevoSaldoEfe -= efectivo;
      nuevoSaldoBco -= banco;
    }

    const path = `users/${user.uid}`;
    await this.firebaseSVC.updateDocument(path, {
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    });

    this.utilsSVC.setUser({
      ...user,
      saldo_banco: nuevoSaldoBco,
      saldo_efectivo: nuevoSaldoEfe
    });
  }
}
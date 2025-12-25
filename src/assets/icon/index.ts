import { addIcons } from 'ionicons';
import { nuevoAhorro } from './ahorro';


export function registerCustomIcons() {
    console.log('Registrando iconos personalizados');
    addIcons({
        'nuevoAhorro': nuevoAhorro
    });
}

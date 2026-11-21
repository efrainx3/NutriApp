import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { RolUsuario } from '../api/seed-data';

export interface PayloadSesionIniciada {
  readonly rol: RolUsuario;
  readonly consentimientoAceptado: boolean;
}

/**
 * Eventos de sesión nombrados en pasado.
 * Al recibir `sesionCerrada`, TODOS los stores del sistema vuelven a su estado inicial.
 */
export const SessionEvents = eventGroup({
  source: 'Sesión',
  events: {
    sesionIniciada: type<PayloadSesionIniciada>(),
    sesionCerrada: type<void>(),
  },
});

import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

/**
 * Eventos de red y conectividad nombrados en pasado.
 */
export const RedEvents = eventGroup({
  source: 'Red',
  events: {
    conexionPerdida: type<void>(),
    conexionRecuperada: type<void>(),
    simulacionOfflineCambiada: type<{ activo: boolean }>(),
    forzarErrorApiCambiado: type<{ activo: boolean }>(),
  },
});

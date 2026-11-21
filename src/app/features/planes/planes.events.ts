import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { PlantillaPlan } from '../../core/api/seed-data';

export const PlanesPageEvents = eventGroup({
  source: 'Planes Page',
  events: {
    plantillasSolicitadas: type<void>(),
    planAsignado: type<{ pacienteId: string; plantillaId: string }>(),
  },
});

export const PlanesApiEvents = eventGroup({
  source: 'Planes API',
  events: {
    plantillasCargadas: type<{ plantillas: readonly PlantillaPlan[] }>(),
    planConfirmado: type<{ pacienteId: string; plantilla: PlantillaPlan }>(),
    planRechazado: type<{ mensajeError: string }>(),
  },
});

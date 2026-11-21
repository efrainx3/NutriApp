import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  EvolucionPacienteData,
  MedicionSemanal,
  PlantillaPlan,
  ValoracionClinica,
} from '../../core/api/seed-data';
import { NivelCumplimiento } from '../../shared/util/calculos';

/**
 * Eventos del módulo compartido `evolucion` (consumido por paciente y profesional).
 */
export const EvolucionPageEvents = eventGroup({
  source: 'Evolución Page',
  events: {
    evolucionSolicitada: type<{ pacienteId: string }>(),
  },
});

export const EvolucionApiEvents = eventGroup({
  source: 'Evolución API',
  events: {
    evolucionCargada: type<EvolucionPacienteData>(),
    evolucionFallida: type<{ mensajeError: string }>(),
    adherenciaRecalculadaPorRegistro: type<{ cumplimiento: NivelCumplimiento }>(),
    medicionAgregadaPorValoracion: type<{
      pacienteId: string;
      tallaCm: number;
      medicion: MedicionSemanal;
      valoracion: ValoracionClinica;
    }>(),
    planPacienteActualizado: type<{
      pacienteId: string;
      plantilla: PlantillaPlan;
    }>(),
  },
});

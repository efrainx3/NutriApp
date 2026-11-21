import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  HoyPacienteResponse,
  RegistroComida,
  TipoComida,
} from '../../core/api/seed-data';
import { NivelCumplimiento } from '../../shared/util/calculos';

export interface PayloadComidaRegistrada {
  readonly id: string;
  readonly pacienteId: string;
  readonly fecha: string;
  readonly tipoComida: TipoComida;
  readonly nombreComida: string;
  readonly cumplimiento: NivelCumplimiento;
  readonly nota?: string;
  readonly creadoEn: string;
}

export interface PayloadRegistroFallido {
  readonly id: string;
  readonly mensajeError: string;
}

/**
 * Eventos originados en las páginas de Registro del paciente (nombrados en pasado).
 */
export const RegistroPageEvents = eventGroup({
  source: 'Registro Page',
  events: {
    hoyAbierta: type<{ pacienteId: string }>(),
    comidaRegistrada: type<PayloadComidaRegistrada>(),
    avisoLimpiado: type<void>(),
  },
});

/**
 * Eventos originados por los manejadores de Registro tras comunicarse con la API o IndexedDB.
 */
export const RegistroApiEvents = eventGroup({
  source: 'Registro API',
  events: {
    hoyCargado: type<HoyPacienteResponse>(),
    hoyFallido: type<{ mensajeError: string }>(),
    registroGuardado: type<RegistroComida>(),
    registroEncolado: type<{ id: string }>(),
    registroFallido: type<PayloadRegistroFallido>(),
  },
});

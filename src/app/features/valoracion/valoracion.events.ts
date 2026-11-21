import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { MedicionSemanal, ValoracionClinica } from '../../core/api/seed-data';

export type PayloadValoracionEnviada = Omit<ValoracionClinica, 'id'>;

export const ValoracionPageEvents = eventGroup({
  source: 'Valoración Page',
  events: {
    valoracionEnviada: type<PayloadValoracionEnviada>(),
    estadoValoracionLimpiado: type<void>(),
  },
});

export const ValoracionApiEvents = eventGroup({
  source: 'Valoración API',
  events: {
    valoracionConfirmada: type<{
      valoracion: ValoracionClinica;
      nuevaMedicion: MedicionSemanal;
    }>(),
    valoracionRechazada: type<{ mensajeError: string }>(),
  },
});

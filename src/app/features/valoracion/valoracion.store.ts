import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { ValoracionClinica } from '../../core/api/seed-data';
import { SessionEvents } from '../../core/auth/session.events';
import { withNutriRutaDevtools } from '../../core/devtools/devtools.feature';
import { ValoracionApiEvents, ValoracionPageEvents } from './valoracion.events';
import { withValoracionEventHandlers } from './valoracion.handlers';

export interface ValoracionState {
  readonly guardando: boolean;
  readonly ultimaConfirmada: ValoracionClinica | null;
  readonly mensajeExito: string;
  readonly mensajeError: string;
}

export const initialValoracionState: ValoracionState = {
  guardando: false,
  ultimaConfirmada: null,
  mensajeExito: '',
  mensajeError: '',
};

/**
 * Store de dominio de Valoración Clínica.
 * Implementa guardado PESIMISTA: al recibir `valoracionEnviada` pasa a `guardando: true`
 * sin modificar la valoración confirmada ni la evolución hasta recibir `valoracionConfirmada`.
 */
export const ValoracionStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('ValoracionStore'),
  withState<ValoracionState>(initialValoracionState),
  withReducer(
    on(ValoracionPageEvents.valoracionEnviada, () => ({
      guardando: true,
      mensajeExito: '',
      mensajeError: '',
    })),
    on(ValoracionApiEvents.valoracionConfirmada, ({ payload }) => ({
      guardando: false,
      ultimaConfirmada: payload.valoracion,
      mensajeExito:
        'Valoración clínica confirmada y registrada en la evolución del paciente.',
      mensajeError: '',
    })),
    on(ValoracionApiEvents.valoracionRechazada, ({ payload }) => ({
      guardando: false,
      mensajeExito: '',
      mensajeError: payload.mensajeError,
    })),
    on(ValoracionPageEvents.estadoValoracionLimpiado, () => ({
      mensajeExito: '',
      mensajeError: '',
    })),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialValoracionState,
    }))
  ),
  withValoracionEventHandlers()
);

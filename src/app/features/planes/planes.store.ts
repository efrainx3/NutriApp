import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import {
  PLANTILLAS_PLAN_SEMILLA,
  PlantillaPlan,
} from '../../core/api/seed-data';
import { SessionEvents } from '../../core/auth/session.events';
import { withNutriRutaDevtools } from '../../core/devtools/devtools.feature';
import { PlanesApiEvents, PlanesPageEvents } from './planes.events';
import { withPlanesEventHandlers } from './planes.handlers';

export interface PlanesState {
  readonly plantillas: readonly PlantillaPlan[];
  readonly guardando: boolean;
  readonly mensajeExito: string;
  readonly mensajeError: string;
}

export const initialPlanesState: PlanesState = {
  plantillas: PLANTILLAS_PLAN_SEMILLA,
  guardando: false,
  mensajeExito: '',
  mensajeError: '',
};

/**
 * Store de dominio de Planes nutricionales (guardado pesimista).
 */
export const PlanesStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('PlanesStore'),
  withState<PlanesState>(initialPlanesState),
  withReducer(
    on(PlanesApiEvents.plantillasCargadas, ({ payload }) => ({
      plantillas: payload.plantillas,
    })),
    on(PlanesPageEvents.planAsignado, () => ({
      guardando: true,
      mensajeExito: '',
      mensajeError: '',
    })),
    on(PlanesApiEvents.planConfirmado, ({ payload }) => ({
      guardando: false,
      mensajeExito: `Plan «${payload.plantilla.nombre}» asignado y confirmado para el paciente.`,
      mensajeError: '',
    })),
    on(PlanesApiEvents.planRechazado, ({ payload }) => ({
      guardando: false,
      mensajeExito: '',
      mensajeError: payload.mensajeError,
    })),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialPlanesState,
    }))
  ),
  withPlanesEventHandlers()
);

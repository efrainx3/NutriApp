import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { exhaustMap, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EvolucionApiEvents } from '../evolucion/evolucion.events';
import { PlanesApiEvents, PlanesPageEvents } from './planes.events';

export function withPlanesEventHandlers() {
  return signalStoreFeature(
    withEventHandlers(
      (
        _,
        events = inject(Events),
        api = inject(ApiService),
        dispatcher = inject(Dispatcher)
      ) => ({
        cargarPlantillas$: events.on(PlanesPageEvents.plantillasSolicitadas).pipe(
          switchMap(() =>
            api.obtenerPlantillasPlan().pipe(
              mapResponse({
                next: (plantillas) =>
                  PlanesApiEvents.plantillasCargadas({ plantillas }),
                error: () =>
                  PlanesApiEvents.planRechazado({
                    mensajeError:
                      'No fue posible actualizar el catálogo de plantillas.',
                  }),
              })
            )
          )
        ),

        asignarPlan$: events.on(PlanesPageEvents.planAsignado).pipe(
          exhaustMap(({ payload }) =>
            api.asignarPlanPaciente(payload.pacienteId, payload.plantillaId).pipe(
              mapResponse({
                next: ({ pacienteId, plantilla }) => {
                  dispatcher.dispatch(
                    EvolucionApiEvents.planPacienteActualizado({
                      pacienteId,
                      plantilla,
                    })
                  );
                  return PlanesApiEvents.planConfirmado({
                    pacienteId,
                    plantilla,
                  });
                },
                error: (err: unknown) => {
                  const mensaje =
                    err instanceof HttpErrorResponse
                      ? err.error?.mensajeAmigable ??
                        'No fue posible asignar el plan en este momento.'
                      : 'No fue posible asignar el plan en este momento.';
                  return PlanesApiEvents.planRechazado({
                    mensajeError: mensaje,
                  });
                },
              })
            )
          )
        ),
      })
    )
  );
}

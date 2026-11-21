import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EvolucionApiEvents, EvolucionPageEvents } from './evolucion.events';

export function withEvolucionEventHandlers() {
  return signalStoreFeature(
    withEventHandlers(
      (_, events = inject(Events), api = inject(ApiService)) => ({
        cargarEvolucion$: events.on(EvolucionPageEvents.evolucionSolicitada).pipe(
          switchMap(({ payload }) =>
            api.obtenerEvolucionPaciente(payload.pacienteId).pipe(
              mapResponse({
                next: (data) => EvolucionApiEvents.evolucionCargada(data),
                error: () =>
                  EvolucionApiEvents.evolucionFallida({
                    mensajeError:
                      'No fue posible actualizar la serie de evolución en este momento.',
                  }),
              })
            )
          )
        ),
      })
    )
  );
}

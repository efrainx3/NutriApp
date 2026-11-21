import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { exhaustMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EvolucionApiEvents } from '../evolucion/evolucion.events';
import { ValoracionApiEvents, ValoracionPageEvents } from './valoracion.events';

/**
 * Manejador de Valoración: envía POST `/valoraciones` y al confirmar emite
 * `valoracionConfirmada` y notifica a `EvolucionStore` la nueva medición.
 */
export function withValoracionEventHandlers() {
  return signalStoreFeature(
    withEventHandlers(
      (
        _,
        events = inject(Events),
        api = inject(ApiService),
        dispatcher = inject(Dispatcher)
      ) => ({
        enviarValoracion$: events.on(ValoracionPageEvents.valoracionEnviada).pipe(
          exhaustMap(({ payload }) =>
            api.crearValoracion(payload).pipe(
              mapResponse({
                next: ({ valoracion, nuevaMedicion }) => {
                  dispatcher.dispatch(
                    EvolucionApiEvents.medicionAgregadaPorValoracion({
                      pacienteId: valoracion.pacienteId,
                      tallaCm: valoracion.antropometria.tallaCm,
                      medicion: nuevaMedicion,
                      valoracion,
                    })
                  );
                  return ValoracionApiEvents.valoracionConfirmada({
                    valoracion,
                    nuevaMedicion,
                  });
                },
                error: (err: unknown) => {
                  const mensaje =
                    err instanceof HttpErrorResponse
                      ? err.error?.mensajeAmigable ??
                        'No se pudo confirmar la valoración con el servidor. Verifica la conexión e intenta de nuevo.'
                      : 'No se pudo confirmar la valoración con el servidor.';
                  return ValoracionApiEvents.valoracionRechazada({
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

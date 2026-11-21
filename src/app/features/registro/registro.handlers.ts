import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { concatMap, exhaustMap, from, mergeMap, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { OfflineQueueService } from '../../core/offline/offline-queue.service';
import { RedEvents } from '../../core/offline/red.events';
import { EvolucionApiEvents } from '../evolucion/evolucion.events';
import { RegistroApiEvents, RegistroPageEvents } from './registro.events';

/**
 * Manejadores de efectos secundarios para el dominio de Registro.
 * - `hoyAbierta` -> GET `/paciente/hoy`
 * - `comidaRegistrada` -> POST `/registros` si hay conexión; si no hay conexión o falla por red (status 0),
 *   guarda en `OfflineQueueService` (IndexedDB) y emite `registroEncolado`.
 * - `conexionRecuperada` -> lee la cola de IndexedDB en orden FIFO, envía cada registro a la API,
 *   lo borra de IndexedDB al sincronizar y emite `registroGuardado`.
 */
export function withRegistroEventHandlers() {
  return signalStoreFeature(
    withEventHandlers(
      (
        _,
        events = inject(Events),
        api = inject(ApiService),
        connectivity = inject(ConnectivityService),
        offlineQueue = inject(OfflineQueueService),
        dispatcher = inject(Dispatcher)
      ) => ({
        cargarHoy$: events.on(RegistroPageEvents.hoyAbierta).pipe(
          switchMap(({ payload }) =>
            api.obtenerHoyPaciente(payload.pacienteId).pipe(
              mapResponse({
                next: (respuesta) => RegistroApiEvents.hoyCargado(respuesta),
                error: () =>
                  RegistroApiEvents.hoyFallido({
                    mensajeError:
                      'Estamos trabajando sin conexión; puedes registrar tus comidas del día con normalidad.',
                  }),
              })
            )
          )
        ),

        registrarComida$: events.on(RegistroPageEvents.comidaRegistrada).pipe(
          mergeMap(({ payload }) => {
            dispatcher.dispatch(
              EvolucionApiEvents.adherenciaRecalculadaPorRegistro({
                cumplimiento: payload.cumplimiento,
              })
            );

            if (!connectivity.estaConectado()) {
              return from(
                offlineQueue.encolar({
                  ...payload,
                  encoladoEn: Date.now(),
                })
              ).pipe(
                mapResponse({
                  next: () =>
                    RegistroApiEvents.registroEncolado({ id: payload.id }),
                  error: () =>
                    RegistroApiEvents.registroEncolado({ id: payload.id }),
                })
              );
            }

            return api.guardarRegistroComida(payload).pipe(
              switchMap((guardado) => of(RegistroApiEvents.registroGuardado(guardado))),
              mapResponse({
                next: (ev) => ev,
                error: (err: unknown) => {
                  if (err instanceof HttpErrorResponse && err.status === 0) {
                    void offlineQueue.encolar({
                      ...payload,
                      encoladoEn: Date.now(),
                    });
                    return RegistroApiEvents.registroEncolado({ id: payload.id });
                  }
                  const mensaje =
                    err instanceof HttpErrorResponse
                      ? err.error?.mensajeAmigable ??
                        err.error?.mensaje ??
                        'No pudimos confirmar tu registro en este intento. Intenta nuevamente cuando quieras.'
                      : 'No pudimos confirmar tu registro en este intento. Intenta nuevamente cuando quieras.';
                  return RegistroApiEvents.registroFallido({
                    id: payload.id,
                    mensajeError: mensaje,
                  });
                },
              })
            );
          })
        ),

        reenviarColaAlReconectar$: events.on(RedEvents.conexionRecuperada).pipe(
          exhaustMap(() =>
            from(offlineQueue.obtenerTodosFifo()).pipe(
              concatMap((pendientes) => from(pendientes)),
              concatMap((item) =>
                api
                  .guardarRegistroComida({
                    id: item.id,
                    pacienteId: item.pacienteId,
                    fecha: item.fecha,
                    tipoComida: item.tipoComida,
                    nombreComida: item.nombreComida,
                    cumplimiento: item.cumplimiento,
                    nota: item.nota,
                    creadoEn: new Date(item.encoladoEn).toISOString(),
                  })
                  .pipe(
                    switchMap((sincronizado) =>
                      from(offlineQueue.eliminarPorId(item.id)).pipe(
                        switchMap(() => {
                          dispatcher.dispatch(
                            RegistroApiEvents.registroGuardado(sincronizado)
                          );
                          return of(null);
                        })
                      )
                    ),
                    mapResponse({
                      next: () => null,
                      error: () => null,
                    })
                  )
              )
            )
          )
        ),
      })
    )
  );
}

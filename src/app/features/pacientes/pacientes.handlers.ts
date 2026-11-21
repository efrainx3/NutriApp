import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { forkJoin, switchMap, tap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EvolucionPageEvents } from '../evolucion/evolucion.events';
import { PacientesApiEvents, PacientesPageEvents } from './pacientes.events';

export function withPacientesEventHandlers() {
  return signalStoreFeature(
    withEventHandlers(
      (
        _,
        events = inject(Events),
        api = inject(ApiService),
        dispatcher = inject(Dispatcher)
      ) => ({
        cargarPacientes$: events.on(PacientesPageEvents.pacientesAbierta).pipe(
          switchMap(() =>
            api.obtenerPacientes().pipe(
              mapResponse({
                next: (pacientes) =>
                  PacientesApiEvents.pacientesCargados({ pacientes }),
                error: () =>
                  PacientesApiEvents.pacientesFallidos({
                    mensajeError:
                      'No fue posible obtener la lista de pacientes. Verifica la conexión.',
                  }),
              })
            )
          )
        ),

        cargarFichaPaciente$: events.on(PacientesPageEvents.fichaAbierta).pipe(
          tap(({ payload }) => {
            dispatcher.dispatch(
              EvolucionPageEvents.evolucionSolicitada({
                pacienteId: payload.pacienteId,
              })
            );
          }),
          switchMap(({ payload }) =>
            forkJoin({
              detalle: api.obtenerFichaPaciente(payload.pacienteId),
              registros: api.obtenerRegistrosPaciente(payload.pacienteId),
            }).pipe(
              mapResponse({
                next: ({ detalle, registros }) =>
                  PacientesApiEvents.fichaCargada({ detalle, registros }),
                error: () =>
                  PacientesApiEvents.fichaFallida({
                    mensajeError:
                      'No fue posible cargar la ficha del paciente en este momento.',
                  }),
              })
            )
          )
        ),

        recargarFichaActual$: events
          .on(
            PacientesApiEvents.resumenActualizadoPorValoracion,
            PacientesApiEvents.resumenActualizadoPorPlan
          )
          .pipe(
            switchMap(() =>
              api.obtenerPacientes().pipe(
                mapResponse({
                  next: (pacientes) =>
                    PacientesApiEvents.pacientesCargados({ pacientes }),
                  error: () =>
                    PacientesApiEvents.pacientesFallidos({
                      mensajeError: 'No se pudo refrescar la lista.',
                    }),
                })
              )
            )
          ),
      })
    )
  );
}

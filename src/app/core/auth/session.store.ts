import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { tap } from 'rxjs';
import { USUARIOS_SEMILLA, UsuarioSesion } from '../api/seed-data';
import { withNutriRutaDevtools } from '../devtools/devtools.feature';
import { OfflineQueueService } from '../offline/offline-queue.service';
import { SessionEvents } from './session.events';

export interface SessionState {
  readonly usuarioActual: UsuarioSesion | null;
  readonly consentimientoDatosAceptado: boolean;
  readonly fechaConsentimiento: string | null;
}

export const initialSessionState: SessionState = {
  usuarioActual: null,
  consentimientoDatosAceptado: false,
  fechaConsentimiento: null,
};

/**
 * Store de sesión en memoria (cumplimiento Ley 1581 de 2012: nunca guarda usuario
 * ni datos clínicos en localStorage o sessionStorage).
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('SessionStore'),
  withState<SessionState>(initialSessionState),
  withReducer(
    on(SessionEvents.sesionIniciada, ({ payload }, state) => {
      if (!payload.consentimientoAceptado) {
        return state;
      }
      const usuario =
        USUARIOS_SEMILLA.find((u) => u.rol === payload.rol) ?? null;

      return {
        usuarioActual: usuario,
        consentimientoDatosAceptado: true,
        fechaConsentimiento: new Date().toISOString(),
      };
    }),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialSessionState,
    }))
  ),
  withComputed(({ usuarioActual, consentimientoDatosAceptado }) => ({
    estaAutenticado: computed(
      () => usuarioActual() !== null && consentimientoDatosAceptado()
    ),
    rolActual: computed(() => usuarioActual()?.rol ?? null),
    nombreUsuario: computed(() => usuarioActual()?.nombre ?? ''),
    pacienteActivoId: computed(() => usuarioActual()?.pacienteId ?? 'pac-jorge'),
  })),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      router = inject(Router),
      offlineQueue = inject(OfflineQueueService)
    ) => ({
      navegarAlIniciarSesion$: events.on(SessionEvents.sesionIniciada).pipe(
        tap(({ payload }) => {
          if (!payload.consentimientoAceptado) {
            return;
          }
          const destino =
            payload.rol === 'profesional' ? '/profesional' : '/paciente/hoy';
          void router.navigateByUrl(destino).catch(() => false);
        })
      ),
      limpiarAlCerrarSesion$: events.on(SessionEvents.sesionCerrada).pipe(
        tap(() => {
          void offlineQueue.limpiarCola();
          void router.navigateByUrl('/login').catch(() => false);
        })
      ),
    })
  )
);

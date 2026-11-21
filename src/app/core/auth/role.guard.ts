import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../api/seed-data';
import { SessionStore } from './session.store';

/**
 * Guard funcional parametrizado por rol esperado ('profesional' | 'paciente').
 * - Si no hay sesión activa en memoria, redirige a `/login`.
 * - Si un paciente intenta abrir `/profesional`, es redirigido a `/paciente/hoy`.
 * - Si un profesional intenta abrir `/paciente`, es redirigido a `/profesional`.
 */
export function roleGuard(rolEsperado: RolUsuario): CanActivateFn {
  return () => {
    const sessionStore = inject(SessionStore);
    const router = inject(Router);

    if (!sessionStore.estaAutenticado()) {
      return router.createUrlTree(['/login']);
    }

    const rolActual = sessionStore.rolActual();
    if (rolActual === rolEsperado) {
      return true;
    }

    if (rolActual === 'paciente') {
      return router.createUrlTree(['/paciente/hoy']);
    }

    return router.createUrlTree(['/profesional']);
  };
}

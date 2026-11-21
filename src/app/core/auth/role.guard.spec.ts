import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { beforeEach, describe, expect, it } from 'vitest';
import { roleGuard } from './role.guard';
import { SessionEvents } from './session.events';
import { SessionStore } from './session.store';

describe('roleGuard (protección de rutas por rol)', () => {
  let dispatcher: Dispatcher;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    TestBed.inject(SessionStore);
    dispatcher = TestBed.inject(Dispatcher);
    dispatcher.dispatch(SessionEvents.sesionCerrada());
  });

  const ejecutarGuard = (rolEsperado: 'profesional' | 'paciente') =>
    TestBed.runInInjectionContext(() =>
      roleGuard(rolEsperado)(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

  it('redirige a /login si el usuario no ha iniciado sesión', () => {
    const resultado = ejecutarGuard('paciente') as UrlTree;
    expect(resultado.toString()).toBe('/login');
  });

  it('permite el acceso cuando el rol autenticado coincide con el esperado', () => {
    dispatcher.dispatch(
      SessionEvents.sesionIniciada({
        rol: 'paciente',
        consentimientoAceptado: true,
      })
    );

    expect(ejecutarGuard('paciente')).toBe(true);
  });

  it('redirige a un paciente que intenta abrir /profesional hacia /paciente/hoy', () => {
    dispatcher.dispatch(
      SessionEvents.sesionIniciada({
        rol: 'paciente',
        consentimientoAceptado: true,
      })
    );

    const resultado = ejecutarGuard('profesional') as UrlTree;
    expect(resultado.toString()).toBe('/paciente/hoy');
  });

  it('redirige a una nutricionista que intenta abrir /paciente hacia /profesional', () => {
    dispatcher.dispatch(
      SessionEvents.sesionIniciada({
        rol: 'profesional',
        consentimientoAceptado: true,
      })
    );

    const resultado = ejecutarGuard('paciente') as UrlTree;
    expect(resultado.toString()).toBe('/profesional');
  });
});

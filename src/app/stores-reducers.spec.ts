import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './core/api/api.service';
import {
  crearBaseDatosSemilla,
  FECHA_HOY_SEMILLA,
  ValoracionClinica,
} from './core/api/seed-data';
import { SessionEvents } from './core/auth/session.events';
import { SessionStore } from './core/auth/session.store';
import { EvolucionApiEvents } from './features/evolucion/evolucion.events';
import { EvolucionStore } from './features/evolucion/evolucion.store';
import { PacientesApiEvents, PacientesPageEvents } from './features/pacientes/pacientes.events';
import { PacientesStore } from './features/pacientes/pacientes.store';
import { PlanesApiEvents, PlanesPageEvents } from './features/planes/planes.events';
import { PlanesStore } from './features/planes/planes.store';
import { RegistroApiEvents, RegistroPageEvents } from './features/registro/registro.events';
import { RegistrosStore } from './features/registro/registros.store';
import { ValoracionApiEvents, ValoracionPageEvents } from './features/valoracion/valoracion.events';
import { ValoracionStore } from './features/valoracion/valoracion.store';

describe('Reducers de todos los SignalStores y reset global con sesionCerrada', () => {
  let dispatcher: Dispatcher;

  beforeEach(() => {
    const apiStub: Partial<ApiService> = {
      obtenerHoyPaciente: vi.fn().mockReturnValue(of()),
      guardarRegistroComida: vi.fn().mockReturnValue(of()),
      obtenerPacientes: vi.fn().mockReturnValue(of()),
      obtenerFichaPaciente: vi.fn().mockReturnValue(of()),
      obtenerEvolucionPaciente: vi.fn().mockReturnValue(of()),
      obtenerRegistrosPaciente: vi.fn().mockReturnValue(of()),
      crearValoracion: vi.fn().mockReturnValue(of()),
      obtenerPlantillasPlan: vi.fn().mockReturnValue(of()),
      asignarPlanPaciente: vi.fn().mockReturnValue(of()),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ApiService, useValue: apiStub },
      ],
    });

    dispatcher = TestBed.inject(Dispatcher);
  });

  it('SessionStore: procesa sesionIniciada solo con consentimiento y se reinicia en sesionCerrada', () => {
    const store = TestBed.inject(SessionStore);

    dispatcher.dispatch(
      SessionEvents.sesionIniciada({
        rol: 'paciente',
        consentimientoAceptado: false,
      })
    );
    expect(store.estaAutenticado()).toBe(false);

    dispatcher.dispatch(
      SessionEvents.sesionIniciada({
        rol: 'paciente',
        consentimientoAceptado: true,
      })
    );
    expect(store.estaAutenticado()).toBe(true);
    expect(store.rolActual()).toBe('paciente');
    expect(store.nombreUsuario()).toBe('Jorge R.');

    dispatcher.dispatch(SessionEvents.sesionCerrada());
    expect(store.estaAutenticado()).toBe(false);
    expect(store.usuarioActual()).toBeNull();
  });

  it('RegistrosStore: procesa comidaRegistrada (optimista), registroGuardado, registroEncolado, registroFallido (revierte) y sesionCerrada', () => {
    const store = TestBed.inject(RegistrosStore);
    const db = crearBaseDatosSemilla();

    dispatcher.dispatch(
      RegistroApiEvents.hoyCargado({
        fechaHoy: FECHA_HOY_SEMILLA,
        paciente: db.pacientes[0],
        planActivo: db.plantillas[0],
        registrosHoy: [],
        registrosSemana: [],
      })
    );

    // 1. Optimista: agrega con estado 'pendiente'
    dispatcher.dispatch(
      RegistroPageEvents.comidaRegistrada({
        id: 'reg-test-1',
        pacienteId: 'pac-jorge',
        fecha: FECHA_HOY_SEMILLA,
        tipoComida: 'almuerzo',
        nombreComida: 'Almuerzo',
        cumplimiento: 'completo',
        creadoEn: '2026-11-21T13:00:00Z',
      })
    );
    expect(store.registrosHoy().length).toBe(1);
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('pendiente');
    expect(store.mensajeConfirmacion()).toBe('Registro guardado');

    // 2. Encolado sin conexión
    dispatcher.dispatch(RegistroApiEvents.registroEncolado({ id: 'reg-test-1' }));
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('en-cola');
    expect(store.cantidadEnCola()).toBe(1);
    expect(store.mensajeConfirmacion()).toContain('Guardado sin conexión');

    // 3. Sincronizado al guardar
    dispatcher.dispatch(
      RegistroApiEvents.registroGuardado({
        ...store.registrosHoy()[0],
        estadoSincronizacion: 'sincronizado',
      })
    );
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('sincronizado');
    expect(store.cantidadEnCola()).toBe(0);

    // 4. Fallido: revierte el registro optimista y muestra mensaje sin culpa
    dispatcher.dispatch(
      RegistroPageEvents.comidaRegistrada({
        id: 'reg-test-fallo',
        pacienteId: 'pac-jorge',
        fecha: FECHA_HOY_SEMILLA,
        tipoComida: 'cena',
        nombreComida: 'Cena',
        cumplimiento: 'parcial',
        creadoEn: '2026-11-21T19:30:00Z',
      })
    );
    expect(store.registrosHoy().length).toBe(2);

    dispatcher.dispatch(
      RegistroApiEvents.registroFallido({
        id: 'reg-test-fallo',
        mensajeError: 'No pudimos confirmar el registro en este intento.',
      })
    );
    expect(store.registrosHoy().length).toBe(1);
    expect(store.mensajeError()).toBe(
      'No pudimos confirmar el registro en este intento.'
    );

    // 5. Reset en sesionCerrada
    dispatcher.dispatch(SessionEvents.sesionCerrada());
    expect(store.registrosHoy().length).toBe(0);
    expect(store.planActivo()).toBeNull();
  });

  it('EvolucionStore: carga serie, recalcula adherencia, agrega medición por valoración y se reinicia en sesionCerrada', () => {
    const store = TestBed.inject(EvolucionStore);
    const db = crearBaseDatosSemilla();

    dispatcher.dispatch(
      EvolucionApiEvents.evolucionCargada({
        pacienteId: 'pac-jorge',
        tallaCm: 172,
        mediciones: db.evoluciones['pac-jorge'],
      })
    );

    expect(store.mediciones().length).toBe(8);
    expect(store.resumenCambioPeso().textoResumen).toBe(
      'Bajó 3,2 kg en 8 semanas'
    );
    expect(store.imcActual()).toBe(28.5);

    const adherenciaAntes = store.adherenciaActualPorcentaje();
    dispatcher.dispatch(
      EvolucionApiEvents.adherenciaRecalculadaPorRegistro({
        cumplimiento: 'completo',
      })
    );
    expect(store.adherenciaActualPorcentaje()).toBe(adherenciaAntes + 2);

    dispatcher.dispatch(SessionEvents.sesionCerrada());
    expect(store.mediciones().length).toBe(0);
  });

  it('PacientesStore: ordena primero pacientes con baja adherencia («Requiere atención»), filtra y se reinicia en sesionCerrada', () => {
    const store = TestBed.inject(PacientesStore);
    const db = crearBaseDatosSemilla();

    dispatcher.dispatch(
      PacientesApiEvents.pacientesCargados({
        pacientes: [...db.pacientes].reverse(),
      })
    );

    const ordenados = store.pacientesOrdenadosYFiltrados();
    expect(ordenados[0].adherenciaTendenciaBaja).toBe(true);
    expect(ordenados[1].adherenciaTendenciaBaja).toBe(true);

    dispatcher.dispatch(
      PacientesPageEvents.busquedaCambiada({ termino: 'Jorge' })
    );
    expect(store.pacientesOrdenadosYFiltrados().length).toBe(1);
    expect(store.pacientesOrdenadosYFiltrados()[0].id).toBe('pac-jorge');

    dispatcher.dispatch(SessionEvents.sesionCerrada());
    expect(store.pacientes().length).toBe(0);
    expect(store.terminoBusqueda()).toBe('');
  });

  it('ValoracionStore y PlanesStore: operan de forma pesimista y vuelven al estado inicial en sesionCerrada', () => {
    const valStore = TestBed.inject(ValoracionStore);
    const planesStore = TestBed.inject(PlanesStore);
    const db = crearBaseDatosSemilla();

    const nuevaVal: ValoracionClinica = {
      ...db.valoraciones['pac-jorge'],
      id: 'val-nueva',
    };

    // Guardado pesimista: mientras está guardando, ultimaConfirmada sigue en null
    dispatcher.dispatch(ValoracionPageEvents.valoracionEnviada(nuevaVal));
    expect(valStore.guardando()).toBe(true);
    expect(valStore.ultimaConfirmada()).toBeNull();

    dispatcher.dispatch(
      ValoracionApiEvents.valoracionConfirmada({
        valoracion: nuevaVal,
        nuevaMedicion: {
          semana: 9,
          etiqueta: 'Sem 9',
          fecha: FECHA_HOY_SEMILLA,
          pesoKg: 83.5,
          adherenciaPorcentaje: 75,
        },
      })
    );
    expect(valStore.guardando()).toBe(false);
    expect(valStore.ultimaConfirmada()?.id).toBe('val-nueva');

    // PlanesStore pesimista
    dispatcher.dispatch(
      PlanesPageEvents.planAsignado({
        pacienteId: 'pac-jorge',
        plantillaId: 'plan-cardio',
      })
    );
    expect(planesStore.guardando()).toBe(true);

    dispatcher.dispatch(
      PlanesApiEvents.planConfirmado({
        pacienteId: 'pac-jorge',
        plantilla: db.plantillas[1],
      })
    );
    expect(planesStore.guardando()).toBe(false);
    expect(planesStore.mensajeExito()).toContain(db.plantillas[1].nombre);

    // Reset en sesionCerrada
    dispatcher.dispatch(SessionEvents.sesionCerrada());
    expect(valStore.ultimaConfirmada()).toBeNull();
    expect(planesStore.mensajeExito()).toBe('');
  });
});

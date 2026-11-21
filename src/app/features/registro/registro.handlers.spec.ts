import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from '../../core/api/api.service';
import { FECHA_HOY_SEMILLA, RegistroComida } from '../../core/api/seed-data';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { OfflineQueueService } from '../../core/offline/offline-queue.service';
import { RedEvents } from '../../core/offline/red.events';
import { RegistroPageEvents } from './registro.events';
import { RegistrosStore } from './registros.store';

describe('Manejadores de Registro (withRegistroEventHandlers): online, offline y reconexión FIFO', () => {
  let dispatcher: Dispatcher;
  let connectivity: ConnectivityService;
  let offlineQueue: OfflineQueueService;
  let guardarSpy: ReturnType<typeof vi.fn<ApiService['guardarRegistroComida']>>;

  beforeEach(async () => {
    guardarSpy = vi.fn<ApiService['guardarRegistroComida']>(
      (payload: Omit<RegistroComida, 'estadoSincronizacion'>) =>
        of({
          ...payload,
          estadoSincronizacion: 'sincronizado' as const,
        })
    );

    const apiMock: Pick<ApiService, 'guardarRegistroComida' | 'obtenerHoyPaciente'> = {
      guardarRegistroComida: guardarSpy,
      obtenerHoyPaciente: vi.fn<ApiService['obtenerHoyPaciente']>().mockReturnValue(of()),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiMock },
      ],
    });

    dispatcher = TestBed.inject(Dispatcher);
    connectivity = TestBed.inject(ConnectivityService);
    offlineQueue = TestBed.inject(OfflineQueueService);
    await offlineQueue.limpiarCola();
    connectivity.alternarSimulacionSinConexion(false);
    TestBed.inject(RegistrosStore);
  });

  it('produce registroGuardado cuando hay conexión activa', () => {
    const store = TestBed.inject(RegistrosStore);

    dispatcher.dispatch(
      RegistroPageEvents.comidaRegistrada({
        id: 'reg-online-1',
        pacienteId: 'pac-jorge',
        fecha: FECHA_HOY_SEMILLA,
        tipoComida: 'almuerzo',
        nombreComida: 'Almuerzo',
        cumplimiento: 'completo',
        creadoEn: '2026-11-21T13:05:00Z',
      })
    );

    expect(guardarSpy).toHaveBeenCalledTimes(1);
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('sincronizado');
  });

  it('produce registroEncolado en IndexedDB sin conexión y vacía la cola al recibir conexionRecuperada', async () => {
    const store = TestBed.inject(RegistrosStore);

    // 1. Activar modo sin conexión
    connectivity.alternarSimulacionSinConexion(true);

    dispatcher.dispatch(
      RegistroPageEvents.comidaRegistrada({
        id: 'reg-offline-cena',
        pacienteId: 'pac-jorge',
        fecha: FECHA_HOY_SEMILLA,
        tipoComida: 'cena',
        nombreComida: 'Cena',
        cumplimiento: 'parcial',
        nota: 'Guardado sin red',
        creadoEn: '2026-11-21T19:45:00Z',
      })
    );

    // Esperar resolución de la promesa de IndexedDB
    await new Promise((r) => setTimeout(r, 30));

    expect(guardarSpy).not.toHaveBeenCalled();
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('en-cola');

    const enColaAntes = await offlineQueue.obtenerTodosFifo();
    expect(enColaAntes.length).toBe(1);
    expect(enColaAntes[0].id).toBe('reg-offline-cena');

    // 2. Reconectar: emite conexionRecuperada y vacía la cola en orden FIFO
    connectivity.alternarSimulacionSinConexion(false);
    dispatcher.dispatch(RedEvents.conexionRecuperada());

    await new Promise((r) => setTimeout(r, 40));

    expect(guardarSpy).toHaveBeenCalledTimes(1);
    const enColaDespues = await offlineQueue.obtenerTodosFifo();
    expect(enColaDespues.length).toBe(0);
    expect(store.registrosHoy()[0].estadoSincronizacion).toBe('sincronizado');
  });
});

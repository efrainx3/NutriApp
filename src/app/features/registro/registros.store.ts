import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import {
  ComidaPlan,
  FECHA_HOY_SEMILLA,
  PacienteResumen,
  PlantillaPlan,
  RegistroComida,
  TipoComida,
} from '../../core/api/seed-data';
import { SessionEvents } from '../../core/auth/session.events';
import { withNutriRutaDevtools } from '../../core/devtools/devtools.feature';
import { RedEvents } from '../../core/offline/red.events';
import { EstadoSincronizacion } from '../../shared/ui/aviso-estado/aviso-estado.component';
import {
  calcularPorcentajeAdherencia,
  calcularProgresoSemanalDias,
  NivelCumplimiento,
} from '../../shared/util/calculos';
import { RegistroApiEvents, RegistroPageEvents } from './registro.events';
import { withRegistroEventHandlers } from './registro.handlers';

export interface TarjetaComidaHoy {
  readonly comida: ComidaPlan;
  readonly registro: RegistroComida | null;
  readonly estadoSincronizacion: EstadoSincronizacion;
  readonly cumplimiento: NivelCumplimiento | null;
}

export interface RegistrosState {
  readonly fechaHoy: string;
  readonly paciente: PacienteResumen | null;
  readonly planActivo: PlantillaPlan | null;
  readonly registrosHoy: readonly RegistroComida[];
  readonly registrosSemana: readonly RegistroComida[];
  readonly cargando: boolean;
  readonly estadoCola: 'inactivo' | 'reintentando';
  readonly mensajeConfirmacion: string;
  readonly mensajeError: string;
}

export const initialRegistrosState: RegistrosState = {
  fechaHoy: FECHA_HOY_SEMILLA,
  paciente: null,
  planActivo: null,
  registrosHoy: [],
  registrosSemana: [],
  cargando: false,
  estadoCola: 'inactivo',
  mensajeConfirmacion: '',
  mensajeError: '',
};

/**
 * Store de dominio de Registros del paciente.
 * Implementa actualización OPTIMISTA en `comidaRegistrada`, revierte en `registroFallido`,
 * marca `en-cola` sin conexión y vuelve al estado inicial en `sesionCerrada`.
 */
export const RegistrosStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('RegistrosStore'),
  withState<RegistrosState>(initialRegistrosState),
  withReducer(
    on(RegistroPageEvents.hoyAbierta, () => ({
      cargando: true,
      mensajeError: '',
    })),
    on(RegistroApiEvents.hoyCargado, ({ payload }, state) => {
      // Conservar registros optimistas o en cola locales que aún no estén en el servidor
      const localesEnCola = state.registrosHoy.filter(
        (r) =>
          r.estadoSincronizacion === 'en-cola' ||
          r.estadoSincronizacion === 'pendiente'
      );
      const tiposLocales = new Set(localesEnCola.map((r) => r.tipoComida));
      const combinadosHoy = [
        ...payload.registrosHoy.filter((r) => !tiposLocales.has(r.tipoComida)),
        ...localesEnCola,
      ];

      const idsRemotos = new Set(payload.registrosSemana.map((r) => r.id));
      const combinadosSemana = [
        ...payload.registrosSemana,
        ...localesEnCola.filter((r) => !idsRemotos.has(r.id)),
      ];

      return {
        fechaHoy: payload.fechaHoy,
        paciente: payload.paciente,
        planActivo: payload.planActivo,
        registrosHoy: combinadosHoy,
        registrosSemana: combinadosSemana,
        cargando: false,
      };
    }),
    on(RegistroApiEvents.hoyFallido, ({ payload }) => ({
      cargando: false,
      mensajeError: payload.mensajeError,
    })),
    on(RegistroPageEvents.comidaRegistrada, ({ payload }, state) => {
      const nuevoRegistroOptimista: RegistroComida = {
        id: payload.id,
        pacienteId: payload.pacienteId,
        fecha: payload.fecha,
        tipoComida: payload.tipoComida,
        nombreComida: payload.nombreComida,
        cumplimiento: payload.cumplimiento,
        nota: payload.nota,
        creadoEn: payload.creadoEn,
        estadoSincronizacion: 'pendiente',
      };

      const registrosHoy = [
        ...state.registrosHoy.filter(
          (r) => r.tipoComida !== payload.tipoComida && r.id !== payload.id
        ),
        nuevoRegistroOptimista,
      ];

      const registrosSemana = [
        ...state.registrosSemana.filter(
          (r) =>
            !(r.fecha === payload.fecha && r.tipoComida === payload.tipoComida) &&
            r.id !== payload.id
        ),
        nuevoRegistroOptimista,
      ];

      return {
        registrosHoy,
        registrosSemana,
        mensajeConfirmacion: 'Registro guardado',
        mensajeError: '',
      };
    }),
    on(RegistroApiEvents.registroGuardado, ({ payload }, state) => {
      const actualizarItem = (r: RegistroComida): RegistroComida =>
        r.id === payload.id ||
        (r.fecha === payload.fecha && r.tipoComida === payload.tipoComida)
          ? { ...payload, estadoSincronizacion: 'sincronizado' }
          : r;

      const existeEnHoy = state.registrosHoy.some(
        (r) =>
          r.id === payload.id ||
          (r.fecha === payload.fecha && r.tipoComida === payload.tipoComida)
      );

      const itemSincronizado: RegistroComida = {
        ...payload,
        estadoSincronizacion: 'sincronizado',
      };
      const registrosHoy: readonly RegistroComida[] = existeEnHoy
        ? state.registrosHoy.map(actualizarItem)
        : payload.fecha === state.fechaHoy
          ? [...state.registrosHoy, itemSincronizado]
          : state.registrosHoy;

      const registrosSemana = state.registrosSemana.map(actualizarItem);
      const quedanEnCola = registrosHoy.some(
        (r) => r.estadoSincronizacion === 'en-cola'
      );

      return {
        registrosHoy,
        registrosSemana,
        estadoCola: quedanEnCola ? state.estadoCola : 'inactivo',
        mensajeConfirmacion: 'Registro guardado y sincronizado',
        mensajeError: '',
      };
    }),
    on(RegistroApiEvents.registroEncolado, ({ payload }, state) => {
      const marcarEnCola = (r: RegistroComida): RegistroComida =>
        r.id === payload.id ? { ...r, estadoSincronizacion: 'en-cola' } : r;

      return {
        registrosHoy: state.registrosHoy.map(marcarEnCola),
        registrosSemana: state.registrosSemana.map(marcarEnCola),
        mensajeConfirmacion: 'Guardado sin conexión; se enviará al reconectar',
        mensajeError: '',
      };
    }),
    on(RegistroApiEvents.registroFallido, ({ payload }, state) => ({
      // Revertir el registro optimista y guardar mensaje de error sin culpa
      registrosHoy: state.registrosHoy.filter((r) => r.id !== payload.id),
      registrosSemana: state.registrosSemana.filter((r) => r.id !== payload.id),
      mensajeConfirmacion: '',
      mensajeError: payload.mensajeError,
    })),
    on(RedEvents.conexionRecuperada, (_, state) => ({
      estadoCola: state.registrosHoy.some(
        (r) => r.estadoSincronizacion === 'en-cola'
      )
        ? 'reintentando'
        : 'inactivo',
    })),
    on(RegistroPageEvents.avisoLimpiado, () => ({
      mensajeConfirmacion: '',
      mensajeError: '',
    })),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialRegistrosState,
    }))
  ),
  withComputed(({ planActivo, registrosHoy, registrosSemana }) => ({
    tarjetasPlanHoy: computed<readonly TarjetaComidaHoy[]>(() => {
      const plan = planActivo();
      if (!plan) return [];
      const regMap = new Map<TipoComida, RegistroComida>();
      for (const r of registrosHoy()) {
        regMap.set(r.tipoComida, r);
      }

      // Máximo 5 tarjetas (desayuno, media mañana, almuerzo, merienda, cena)
      return plan.comidas.slice(0, 5).map((comida) => {
        const reg = regMap.get(comida.tipo) ?? null;
        return {
          comida,
          registro: reg,
          estadoSincronizacion: reg ? reg.estadoSincronizacion : 'sin-registrar',
          cumplimiento: reg ? reg.cumplimiento : null,
        };
      });
    }),
    proximaComidaPorRegistrar: computed<TipoComida>(() => {
      const plan = planActivo();
      if (!plan) return 'almuerzo';
      const registrados = new Set(registrosHoy().map((r) => r.tipoComida));
      const pendiente = plan.comidas.find((c) => !registrados.has(c.tipo));
      return pendiente ? pendiente.tipo : 'almuerzo';
    }),
    progresoSemanal: computed(() =>
      calcularProgresoSemanalDias(registrosSemana(), 7)
    ),
    adherenciaSemanalCalculada: computed(() =>
      calcularPorcentajeAdherencia(registrosSemana())
    ),
    cantidadEnCola: computed(
      () =>
        registrosHoy().filter((r) => r.estadoSincronizacion === 'en-cola').length
    ),
  })),
  withRegistroEventHandlers()
);

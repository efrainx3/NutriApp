import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import {
  FichaPacienteDetalle,
  PacienteResumen,
  RegistroComida,
} from '../../core/api/seed-data';
import { SessionEvents } from '../../core/auth/session.events';
import { withNutriRutaDevtools } from '../../core/devtools/devtools.feature';
import { calcularImc, clasificarImc } from '../../shared/util/calculos';
import { EvolucionApiEvents } from '../evolucion/evolucion.events';
import { PacientesApiEvents, PacientesPageEvents } from './pacientes.events';
import { withPacientesEventHandlers } from './pacientes.handlers';

export interface PacientesState {
  readonly pacientes: readonly PacienteResumen[];
  readonly pacienteSeleccionadoId: string;
  readonly fichaActiva: FichaPacienteDetalle | null;
  readonly registrosPacienteActivo: readonly RegistroComida[];
  readonly terminoBusqueda: string;
  readonly cargandoLista: boolean;
  readonly cargandoFicha: boolean;
  readonly error: string;
}

export const initialPacientesState: PacientesState = {
  pacientes: [],
  pacienteSeleccionadoId: 'pac-jorge',
  fichaActiva: null,
  registrosPacienteActivo: [],
  terminoBusqueda: '',
  cargandoLista: false,
  cargandoFicha: false,
  error: '',
};

/**
 * Store de dominio de Pacientes (panel del nutricionista).
 * Ordena la lista priorizando pacientes cuya adherencia bajó («Requiere atención»)
 * y mantiene la ficha sincronizada con los registros del paciente, las valoraciones
 * y los planes asignados.
 */
export const PacientesStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('PacientesStore'),
  withState<PacientesState>(initialPacientesState),
  withReducer(
    on(PacientesPageEvents.pacientesAbierta, () => ({
      cargandoLista: true,
      error: '',
    })),
    on(PacientesApiEvents.pacientesCargados, ({ payload }) => ({
      pacientes: payload.pacientes,
      cargandoLista: false,
      error: '',
    })),
    on(PacientesApiEvents.pacientesFallidos, ({ payload }) => ({
      cargandoLista: false,
      error: payload.mensajeError,
    })),
    on(PacientesPageEvents.fichaAbierta, ({ payload }) => ({
      pacienteSeleccionadoId: payload.pacienteId,
      cargandoFicha: true,
      error: '',
    })),
    on(PacientesApiEvents.fichaCargada, ({ payload }) => ({
      fichaActiva: payload.detalle,
      registrosPacienteActivo: payload.registros,
      pacienteSeleccionadoId: payload.detalle.paciente.id,
      cargandoFicha: false,
      error: '',
    })),
    on(PacientesApiEvents.fichaFallida, ({ payload }) => ({
      cargandoFicha: false,
      error: payload.mensajeError,
    })),
    on(PacientesPageEvents.busquedaCambiada, ({ payload }) => ({
      terminoBusqueda: payload.termino,
    })),
    on(
      PacientesApiEvents.resumenActualizadoPorValoracion,
      EvolucionApiEvents.medicionAgregadaPorValoracion,
      ({ payload }, state) => {
        const val = payload.valoracion;
        const pacientes = state.pacientes.map((p) =>
          p.id === val.pacienteId
            ? {
                ...p,
                pesoActualKg: val.antropometria.pesoKg,
                tallaCm: val.antropometria.tallaCm,
                proximoControl: val.objetivos.proximoControlFecha,
              }
            : p
        );

        const fichaActiva =
          state.fichaActiva && state.fichaActiva.paciente.id === val.pacienteId
            ? {
                ...state.fichaActiva,
                paciente: {
                  ...state.fichaActiva.paciente,
                  pesoActualKg: val.antropometria.pesoKg,
                  tallaCm: val.antropometria.tallaCm,
                  proximoControl: val.objetivos.proximoControlFecha,
                },
                ultimaValoracion: val,
              }
            : state.fichaActiva;

        return {
          pacientes,
          fichaActiva,
        };
      }
    ),
    on(
      PacientesApiEvents.resumenActualizadoPorPlan,
      EvolucionApiEvents.planPacienteActualizado,
      ({ payload }, state) => {
      const pacientes = state.pacientes.map((p) =>
        p.id === payload.pacienteId
          ? {
              ...p,
              planAsignadoId: payload.plantilla.id,
              planAsignadoNombre: payload.plantilla.nombre,
            }
          : p
      );

      const fichaActiva =
        state.fichaActiva &&
        state.fichaActiva.paciente.id === payload.pacienteId
          ? {
              ...state.fichaActiva,
              paciente: {
                ...state.fichaActiva.paciente,
                planAsignadoId: payload.plantilla.id,
                planAsignadoNombre: payload.plantilla.nombre,
              },
              planActivo: payload.plantilla,
            }
          : state.fichaActiva;

      return {
        pacientes,
        fichaActiva,
      };
    }),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialPacientesState,
    }))
  ),
  withComputed(({ pacientes, terminoBusqueda, fichaActiva }) => ({
    /**
     * Lista filtrada por buscador y ordenada primero por quienes bajaron su adherencia
     * (etiqueta «Requiere atención») y luego por menor % de adherencia.
     */
    pacientesOrdenadosYFiltrados: computed<readonly PacienteResumen[]>(() => {
      const q = terminoBusqueda().trim().toLowerCase();
      const filtrados = q
        ? pacientes().filter(
            (p) =>
              p.nombre.toLowerCase().includes(q) ||
              p.diagnostico.toLowerCase().includes(q)
          )
        : [...pacientes()];

      return [...filtrados].sort((a, b) => {
        if (a.adherenciaTendenciaBaja !== b.adherenciaTendenciaBaja) {
          return a.adherenciaTendenciaBaja ? -1 : 1;
        }
        return a.adherenciaActual - b.adherenciaActual;
      });
    }),
    imcFichaActiva: computed(() => {
      const f = fichaActiva();
      if (!f) return null;
      return calcularImc(f.paciente.pesoActualKg, f.paciente.tallaCm);
    }),
    clasificacionImcFicha: computed(() => {
      const f = fichaActiva();
      if (!f) return '';
      return clasificarImc(
        calcularImc(f.paciente.pesoActualKg, f.paciente.tallaCm)
      );
    }),
  })),
  withPacientesEventHandlers()
);

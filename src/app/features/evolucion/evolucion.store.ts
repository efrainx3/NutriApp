import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { MedicionSemanal } from '../../core/api/seed-data';
import { SessionEvents } from '../../core/auth/session.events';
import { withNutriRutaDevtools } from '../../core/devtools/devtools.feature';
import { PuntoEvolucion } from '../../shared/ui/grafica-evolucion/grafica-evolucion.component';
import {
  calcularCambioPeso,
  calcularImc,
  clasificarImc,
} from '../../shared/util/calculos';
import { EvolucionApiEvents, EvolucionPageEvents } from './evolucion.events';
import { withEvolucionEventHandlers } from './evolucion.handlers';

export interface EvolucionState {
  readonly pacienteId: string;
  readonly tallaCm: number;
  readonly mediciones: readonly MedicionSemanal[];
  readonly registrosoptimistasDelta: number;
  readonly cargando: boolean;
  readonly error: string;
}

export const initialEvolucionState: EvolucionState = {
  pacienteId: 'pac-jorge',
  tallaCm: 172,
  mediciones: [],
  registrosoptimistasDelta: 0,
  cargando: false,
  error: '',
};

/**
 * Store compartido de Evolución (consumido tanto por el Paciente en «Progreso»
 * como por la Nutricionista en la «Ficha del Paciente»).
 * Reacciona también a `comidaRegistrada` para recalcular la adherencia de la última semana,
 * a `medicionAgregadaPorValoracion` al confirmar una valoración, y se reinicia en `sesionCerrada`.
 */
export const EvolucionStore = signalStore(
  { providedIn: 'root' },
  withNutriRutaDevtools('EvolucionStore'),
  withState<EvolucionState>(initialEvolucionState),
  withReducer(
    on(EvolucionPageEvents.evolucionSolicitada, ({ payload }) => ({
      pacienteId: payload.pacienteId,
      cargando: true,
      error: '',
    })),
    on(EvolucionApiEvents.evolucionCargada, ({ payload }) => ({
      pacienteId: payload.pacienteId,
      tallaCm: payload.tallaCm,
      mediciones: payload.mediciones,
      cargando: false,
      error: '',
    })),
    on(EvolucionApiEvents.evolucionFallida, ({ payload }) => ({
      cargando: false,
      error: payload.mensajeError,
    })),
    on(EvolucionApiEvents.adherenciaRecalculadaPorRegistro, ({ payload }, state) => {
      if (state.mediciones.length === 0) {
        return {
          registrosoptimistasDelta: state.registrosoptimistasDelta + 1,
        };
      }
      const ultimaIdx = state.mediciones.length - 1;
      const ajuste =
        payload.cumplimiento === 'completo'
          ? 2
          : payload.cumplimiento === 'parcial'
            ? 1
            : -2;

      const nuevasMediciones = state.mediciones.map((m, idx) =>
        idx === ultimaIdx
          ? {
              ...m,
              adherenciaPorcentaje: Math.max(
                0,
                Math.min(100, m.adherenciaPorcentaje + ajuste)
              ),
            }
          : m
      );

      return {
        mediciones: nuevasMediciones,
        registrosoptimistasDelta: state.registrosoptimistasDelta + 1,
      };
    }),
    on(
      EvolucionApiEvents.medicionAgregadaPorValoracion,
      ({ payload }, state) => {
        if (state.pacienteId !== payload.pacienteId) {
          return state;
        }
        return {
          tallaCm: payload.tallaCm,
          mediciones: [...state.mediciones, payload.medicion],
        };
      }
    ),
    on(SessionEvents.sesionCerrada, () => ({
      ...initialEvolucionState,
    }))
  ),
  withComputed(({ mediciones, tallaCm }) => ({
    puntosPeso: computed<readonly PuntoEvolucion[]>(() =>
      mediciones().map((m) => ({
        etiqueta: m.etiqueta,
        valor: m.pesoKg,
      }))
    ),
    puntosAdherencia: computed<readonly PuntoEvolucion[]>(() =>
      mediciones().map((m) => ({
        etiqueta: m.etiqueta,
        valor: m.adherenciaPorcentaje,
      }))
    ),
    resumenCambioPeso: computed(() =>
      calcularCambioPeso(mediciones().map((m) => m.pesoKg))
    ),
    pesoActualKg: computed(() => {
      const lista = mediciones();
      return lista.length > 0 ? lista[lista.length - 1].pesoKg : null;
    }),
    adherenciaActualPorcentaje: computed(() => {
      const lista = mediciones();
      return lista.length > 0
        ? lista[lista.length - 1].adherenciaPorcentaje
        : 0;
    }),
    imcActual: computed(() => {
      const lista = mediciones();
      const peso = lista.length > 0 ? lista[lista.length - 1].pesoKg : null;
      return calcularImc(peso, tallaCm());
    }),
    clasificacionImcActual: computed(() => {
      const lista = mediciones();
      const peso = lista.length > 0 ? lista[lista.length - 1].pesoKg : null;
      return clasificarImc(calcularImc(peso, tallaCm()));
    }),
    resumenAdherenciaTexto: computed(() => {
      const lista = mediciones();
      if (lista.length === 0) return 'Sin datos de adherencia registrados';
      const promedio = Math.round(
        lista.reduce((acc, m) => acc + m.adherenciaPorcentaje, 0) / lista.length
      );
      const actual = lista[lista.length - 1].adherenciaPorcentaje;
      return `Promedio ${promedio} % en ${lista.length} semanas (semana actual: ${actual} %)`;
    }),
  })),
  withEvolucionEventHandlers()
);

import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  FichaPacienteDetalle,
  PacienteResumen,
  PlantillaPlan,
  RegistroComida,
  ValoracionClinica,
} from '../../core/api/seed-data';

export const PacientesPageEvents = eventGroup({
  source: 'Pacientes Page',
  events: {
    pacientesAbierta: type<void>(),
    fichaAbierta: type<{ pacienteId: string }>(),
    busquedaCambiada: type<{ termino: string }>(),
  },
});

export const PacientesApiEvents = eventGroup({
  source: 'Pacientes API',
  events: {
    pacientesCargados: type<{ pacientes: readonly PacienteResumen[] }>(),
    pacientesFallidos: type<{ mensajeError: string }>(),
    fichaCargada: type<{
      detalle: FichaPacienteDetalle;
      registros: readonly RegistroComida[];
    }>(),
    fichaFallida: type<{ mensajeError: string }>(),
    resumenActualizadoPorValoracion: type<{
      valoracion: ValoracionClinica;
    }>(),
    resumenActualizadoPorPlan: type<{
      pacienteId: string;
      plantilla: PlantillaPlan;
    }>(),
  },
});

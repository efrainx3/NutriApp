import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EvolucionPacienteData,
  FichaPacienteDetalle,
  HoyPacienteResponse,
  MedicionSemanal,
  PacienteResumen,
  PlantillaPlan,
  RegistroComida,
  ValoracionClinica,
} from './seed-data';

/**
 * Único punto de comunicación HTTP con el backend simulado.
 * Regla Flux: solo los manejadores de eventos (`*.handlers.ts`) inyectan ApiService;
 * ningún componente ni store lo llama directamente.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly #http = inject(HttpClient);

  obtenerHoyPaciente(pacienteId = 'pac-jorge'): Observable<HoyPacienteResponse> {
    return this.#http.get<HoyPacienteResponse>('/api/paciente/hoy', {
      params: { pacienteId },
    });
  }

  guardarRegistroComida(
    registro: Omit<RegistroComida, 'estadoSincronizacion'>
  ): Observable<RegistroComida> {
    return this.#http.post<RegistroComida>('/api/registros', registro);
  }

  obtenerPacientes(): Observable<PacienteResumen[]> {
    return this.#http.get<PacienteResumen[]>('/api/pacientes');
  }

  obtenerFichaPaciente(pacienteId: string): Observable<FichaPacienteDetalle> {
    return this.#http.get<FichaPacienteDetalle>(`/api/pacientes/${pacienteId}`);
  }

  obtenerEvolucionPaciente(pacienteId: string): Observable<EvolucionPacienteData> {
    return this.#http.get<EvolucionPacienteData>(
      `/api/pacientes/${pacienteId}/evolucion`
    );
  }

  obtenerRegistrosPaciente(pacienteId: string): Observable<RegistroComida[]> {
    return this.#http.get<RegistroComida[]>(
      `/api/pacientes/${pacienteId}/registros`
    );
  }

  crearValoracion(
    valoracion: Omit<ValoracionClinica, 'id'>
  ): Observable<{ valoracion: ValoracionClinica; nuevaMedicion: MedicionSemanal }> {
    return this.#http.post<{
      valoracion: ValoracionClinica;
      nuevaMedicion: MedicionSemanal;
    }>('/api/valoraciones', valoracion);
  }

  obtenerPlantillasPlan(): Observable<PlantillaPlan[]> {
    return this.#http.get<PlantillaPlan[]>('/api/planes/plantillas');
  }

  asignarPlanPaciente(
    pacienteId: string,
    plantillaId: string
  ): Observable<{ pacienteId: string; plantilla: PlantillaPlan }> {
    return this.#http.put<{ pacienteId: string; plantilla: PlantillaPlan }>(
      `/api/pacientes/${pacienteId}/plan`,
      { plantillaId }
    );
  }
}

import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, of, throwError } from 'rxjs';
import { calcularPorcentajeAdherencia } from '../../shared/util/calculos';
import { ConnectivityService } from '../offline/connectivity.service';
import {
  BaseDatosMemoria,
  crearBaseDatosSemilla,
  EvolucionPacienteData,
  FECHA_HOY_SEMILLA,
  FichaPacienteDetalle,
  HoyPacienteResponse,
  RegistroComida,
  ValoracionClinica,
} from './seed-data';

/**
 * Instancia única en memoria compartida para toda la sesión del navegador.
 * Así, lo que registra el paciente (Jorge R.) aparece inmediatamente en la ficha
 * cuando la nutricionista (Dra. Camila) inicia sesión.
 */
let dbMemoria: BaseDatosMemoria = crearBaseDatosSemilla();

export function reiniciarBaseDatosSemilla(): void {
  dbMemoria = crearBaseDatosSemilla();
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const connectivity = inject(ConnectivityService);
  const latencia = connectivity.latenciaMs();

  // 1. Si el modo sin conexión está activo, rechazar con error de red (status 0)
  if (!connectivity.estaConectado()) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 0,
          statusText: 'Sin conexión a internet',
          url: req.url,
          error: {
            codigo: 'OFFLINE',
            mensaje: 'Sin conexión de red disponible en este momento.',
          },
        })
    );
  }

  const ruta = req.url.replace(/^\/api/, '');
  const metodo = req.method.toUpperCase();

  // GET /paciente/hoy
  if (metodo === 'GET' && ruta === '/paciente/hoy') {
    const pacienteId = req.params.get('pacienteId') ?? 'pac-jorge';
    const paciente =
      dbMemoria.pacientes.find((p) => p.id === pacienteId) ?? dbMemoria.pacientes[0];
    const planActivo =
      dbMemoria.plantillas.find((pl) => pl.id === paciente.planAsignadoId) ??
      dbMemoria.plantillas[0];
    const todosRegistros = dbMemoria.registros[paciente.id] ?? [];
    const registrosHoy = todosRegistros.filter((r) => r.fecha === FECHA_HOY_SEMILLA);
    const fechasUltimaSemana = new Set([
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      FECHA_HOY_SEMILLA,
    ]);
    const registrosSemana = todosRegistros.filter((r) =>
      fechasUltimaSemana.has(r.fecha)
    );

    const respuesta: HoyPacienteResponse = {
      fechaHoy: FECHA_HOY_SEMILLA,
      paciente: { ...paciente },
      planActivo,
      registrosHoy: registrosHoy.map((r) => ({ ...r })),
      registrosSemana: registrosSemana.map((r) => ({ ...r })),
    };

    return of(new HttpResponse({ status: 200, body: respuesta })).pipe(delay(latencia));
  }

  // GET /pacientes
  if (metodo === 'GET' && ruta === '/pacientes') {
    const lista = dbMemoria.pacientes.map((p) => ({ ...p }));
    return of(new HttpResponse({ status: 200, body: lista })).pipe(delay(latencia));
  }

  // GET /planes/plantillas
  if (metodo === 'GET' && ruta === '/planes/plantillas') {
    const plantillas = dbMemoria.plantillas.map((p) => ({ ...p }));
    return of(new HttpResponse({ status: 200, body: plantillas })).pipe(delay(latencia));
  }

  // GET /pacientes/:id/evolucion
  const matchEvolucion = ruta.match(/^\/pacientes\/([^/]+)\/evolucion$/);
  if (metodo === 'GET' && matchEvolucion) {
    const pacienteId = matchEvolucion[1];
    const paciente =
      dbMemoria.pacientes.find((p) => p.id === pacienteId) ?? dbMemoria.pacientes[0];
    const mediciones = (dbMemoria.evoluciones[paciente.id] ?? []).map((m) => ({
      ...m,
    }));
    const body: EvolucionPacienteData = {
      pacienteId: paciente.id,
      tallaCm: paciente.tallaCm,
      mediciones,
    };
    return of(new HttpResponse({ status: 200, body })).pipe(delay(latencia));
  }

  // GET /pacientes/:id/registros
  const matchRegistros = ruta.match(/^\/pacientes\/([^/]+)\/registros$/);
  if (metodo === 'GET' && matchRegistros) {
    const pacienteId = matchRegistros[1];
    const registros = (dbMemoria.registros[pacienteId] ?? [])
      .map((r) => ({ ...r }))
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    return of(new HttpResponse({ status: 200, body: registros })).pipe(delay(latencia));
  }

  // GET /pacientes/:id
  const matchFicha = ruta.match(/^\/pacientes\/([^/]+)$/);
  if (metodo === 'GET' && matchFicha) {
    const pacienteId = matchFicha[1];
    const paciente =
      dbMemoria.pacientes.find((p) => p.id === pacienteId) ?? dbMemoria.pacientes[0];
    const planActivo =
      dbMemoria.plantillas.find((pl) => pl.id === paciente.planAsignadoId) ??
      dbMemoria.plantillas[0];
    const ultimaValoracion = dbMemoria.valoraciones[paciente.id] ?? null;

    const detalle: FichaPacienteDetalle = {
      paciente: { ...paciente },
      planActivo,
      ultimaValoracion: ultimaValoracion ? { ...ultimaValoracion } : null,
    };
    return of(new HttpResponse({ status: 200, body: detalle })).pipe(delay(latencia));
  }

  // POST /registros
  if (metodo === 'POST' && ruta === '/registros') {
    if (connectivity.forzarErrorPostRegistro()) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            statusText: 'Servicio temporalmente ocupado',
            url: req.url,
            error: {
              codigo: 'ERROR_SERVIDOR_SIMULADO',
              mensaje:
                'No pudimos confirmar el registro en el servidor en este intento. Puedes volver a tocar tu opción cuando quieras.',
            },
          })
      ).pipe(delay(latencia));
    }

    const payload = req.body as Omit<RegistroComida, 'estadoSincronizacion'>;
    const registroSincronizado: RegistroComida = {
      ...payload,
      estadoSincronizacion: 'sincronizado',
    };

    const listaActual = dbMemoria.registros[payload.pacienteId] ?? [];
    // Reemplaza si ya existía para la misma fecha y tipoComida o el mismo id
    const filtrada = listaActual.filter(
      (r) =>
        r.id !== payload.id &&
        !(r.fecha === payload.fecha && r.tipoComida === payload.tipoComida)
    );
    const nuevaLista = [...filtrada, registroSincronizado];
    dbMemoria.registros[payload.pacienteId] = nuevaLista;

    // Recalcular adherencia actual del paciente en memoria compartida
    const nuevoPorcentaje = calcularPorcentajeAdherencia(nuevaLista);
    dbMemoria.pacientes = dbMemoria.pacientes.map((p) =>
      p.id === payload.pacienteId
        ? {
            ...p,
            adherenciaActual: nuevoPorcentaje,
          }
        : p
    );

    const evolPaciente = dbMemoria.evoluciones[payload.pacienteId];
    if (evolPaciente && evolPaciente.length > 0) {
      const ultimaIdx = evolPaciente.length - 1;
      dbMemoria.evoluciones[payload.pacienteId] = evolPaciente.map((m, idx) =>
        idx === ultimaIdx ? { ...m, adherenciaPorcentaje: nuevoPorcentaje } : m
      );
    }

    return of(new HttpResponse({ status: 201, body: registroSincronizado })).pipe(
      delay(latencia)
    );
  }

  // POST /valoraciones
  if (metodo === 'POST' && ruta === '/valoraciones') {
    const nuevaVal = req.body as Omit<ValoracionClinica, 'id'> & { id?: string };
    const valoracionConfirmada: ValoracionClinica = {
      ...nuevaVal,
      id: nuevaVal.id ?? `val-${Date.now()}`,
    };

    dbMemoria.valoraciones[valoracionConfirmada.pacienteId] = valoracionConfirmada;

    // Actualizar peso actual, talla y próximo control en el resumen del paciente
    dbMemoria.pacientes = dbMemoria.pacientes.map((p) =>
      p.id === valoracionConfirmada.pacienteId
        ? {
            ...p,
            pesoActualKg: valoracionConfirmada.antropometria.pesoKg,
            tallaCm: valoracionConfirmada.antropometria.tallaCm,
            proximoControl: valoracionConfirmada.objetivos.proximoControlFecha,
          }
        : p
    );

    // Agregar o actualizar medición de evolución
    const listaMed = dbMemoria.evoluciones[valoracionConfirmada.pacienteId] ?? [];
    const pacienteActual = dbMemoria.pacientes.find(
      (p) => p.id === valoracionConfirmada.pacienteId
    );
    const adherencia = pacienteActual?.adherenciaActual ?? 75;
    const nuevaSemana = listaMed.length + 1;
    const nuevaMedicion = {
      semana: nuevaSemana,
      etiqueta: `Sem ${nuevaSemana}`,
      fecha: valoracionConfirmada.fecha,
      pesoKg: valoracionConfirmada.antropometria.pesoKg,
      adherenciaPorcentaje: adherencia,
    };

    dbMemoria.evoluciones[valoracionConfirmada.pacienteId] = [
      ...listaMed,
      nuevaMedicion,
    ];

    return of(
      new HttpResponse({
        status: 201,
        body: {
          valoracion: valoracionConfirmada,
          nuevaMedicion,
        },
      })
    ).pipe(delay(latencia));
  }

  // PUT /pacientes/:id/plan
  const matchPlan = ruta.match(/^\/pacientes\/([^/]+)\/plan$/);
  if (metodo === 'PUT' && matchPlan) {
    const pacienteId = matchPlan[1];
    const { plantillaId } = req.body as { plantillaId: string };
    const plantilla = dbMemoria.plantillas.find((pl) => pl.id === plantillaId);

    if (!plantilla) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Plantilla no encontrada',
            url: req.url,
          })
      ).pipe(delay(latencia));
    }

    dbMemoria.pacientes = dbMemoria.pacientes.map((p) =>
      p.id === pacienteId
        ? {
            ...p,
            planAsignadoId: plantilla.id,
            planAsignadoNombre: plantilla.nombre,
          }
        : p
    );

    return of(
      new HttpResponse({
        status: 200,
        body: {
          pacienteId,
          plantilla,
        },
      })
    ).pipe(delay(latencia));
  }

  return next(req);
};

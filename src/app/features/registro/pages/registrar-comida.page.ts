import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { TipoComida } from '../../../core/api/seed-data';
import { SessionStore } from '../../../core/auth/session.store';
import { BotonCumplimientoComponent } from '../../../shared/ui/boton-cumplimiento/boton-cumplimiento.component';
import { NivelCumplimiento } from '../../../shared/util/calculos';
import { RegistroPageEvents } from '../registro.events';
import { RegistrosStore } from '../registros.store';

/**
 * Pantalla de registro de una comida en un toque:
 * - Una sola pregunta clara («¿Seguiste el almuerzo?»).
 * - Resumen del plan de esa comida.
 * - Tres botones grandes (mínimo 44x44 px): «Sí, completo», «Parcialmente», «No lo seguí».
 * - Nota opcional.
 * - Se guarda inmediatamente al tocar una opción y vuelve a «Hoy» mostrando la confirmación aria-live.
 */
@Component({
  selector: 'app-registrar-comida-page',
  standalone: true,
  imports: [BotonCumplimientoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="registro-comida" aria-labelledby="titulo-pregunta-comida">
      <header class="registro-comida__header">
        <button
          type="button"
          class="registro-comida__volver"
          (click)="volverAHoy()"
        >
          ← Volver a Hoy
        </button>

        <span class="registro-comida__paso">Registro en un toque</span>
        <h1 id="titulo-pregunta-comida" class="registro-comida__pregunta">
          ¿Seguiste {{ articuloYNombreComida() }}?
        </h1>
      </header>

      @if (comidaActual(); as info) {
        <section class="registro-comida__plan-box" aria-label="Resumen del plan sugerido">
          <span class="registro-comida__horario nr-tabular-nums">
            Horario sugerido: {{ info.comida.horarioSugerido }}
          </span>
          <p class="registro-comida__descripcion">{{ info.comida.descripcion }}</p>
          <p class="registro-comida__porciones">
            <strong>Guía de porciones:</strong> {{ info.comida.porcionesIdeales }}
          </p>
        </section>

        <div class="registro-comida__nota-box">
          <label for="nota-opcional-comida" class="registro-comida__label">
            Nota opcional para tu nutricionista (antes de tocar tu opción)
          </label>
          <input
            id="nota-opcional-comida"
            type="text"
            class="registro-comida__input"
            placeholder="Ej. Cambié el arroz por quinua o comí fuera de casa"
            [value]="notaOpcional()"
            (input)="actualizarNota($event)"
          />
        </div>

        <section aria-label="Selecciona una opción para guardar inmediatamente">
          <app-boton-cumplimiento
            [seleccionado]="info.cumplimiento"
            (elegir)="registrarAlTocar($event)"
          />
        </section>
      }
    </main>
  `,
  styles: `
    .registro-comida {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-6);
    }

    .registro-comida__header {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .registro-comida__volver {
      align-self: flex-start;
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 1px solid var(--nr-border);
      background-color: var(--nr-surface-card);
      color: var(--nr-text-primary);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      cursor: pointer;
    }

    .registro-comida__paso {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-color-action-primary);
    }

    .registro-comida__pregunta {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
      line-height: var(--nr-line-height-heading);
    }

    .registro-comida__plan-box {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-left: 4px solid var(--nr-color-action-primary);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .registro-comida__horario {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .registro-comida__descripcion {
      margin: 0;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-primary);
    }

    .registro-comida__porciones {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .registro-comida__nota-box {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .registro-comida__label {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .registro-comida__input {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-card);
      border: 1px solid var(--nr-border);
      font-size: var(--nr-font-size-base);
      font-family: var(--nr-font-sans);
      color: var(--nr-text-primary);
      background-color: var(--nr-surface-card);
    }
  `,
})
export class RegistrarComidaPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #sessionStore = inject(SessionStore);
  readonly #registrosStore = inject(RegistrosStore);
  readonly #dispatchRegistro = injectDispatch(RegistroPageEvents);

  readonly tipoSeleccionado = signal<TipoComida>(
    (this.#route.snapshot.paramMap.get('tipo') as TipoComida) ?? 'almuerzo'
  );
  readonly notaOpcional = signal<string>('');

  readonly comidaActual = computed(() => {
    const tipo = this.tipoSeleccionado();
    const tarjetas = this.#registrosStore.tarjetasPlanHoy();
    return tarjetas.find((t) => t.comida.tipo === tipo) ?? tarjetas[0] ?? null;
  });

  readonly articuloYNombreComida = computed(() => {
    const info = this.comidaActual();
    if (!info) return 'el almuerzo';
    const tipo = info.comida.tipo;
    if (tipo === 'desayuno' || tipo === 'almuerzo') {
      return `el ${info.comida.nombre.toLowerCase()}`;
    }
    return `la ${info.comida.nombre.toLowerCase()}`;
  });

  actualizarNota(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.notaOpcional.set(inputEl.value);
  }

  registrarAlTocar(cumplimiento: NivelCumplimiento): void {
    const info = this.comidaActual();
    if (!info) return;

    const pacienteId = this.#sessionStore.pacienteActivoId();
    const fecha = this.#registrosStore.fechaHoy();
    const notaLimpia = this.notaOpcional().trim();

    this.#dispatchRegistro.comidaRegistrada({
      id: `reg-${pacienteId}-${fecha}-${info.comida.tipo}-${Date.now()}`,
      pacienteId,
      fecha,
      tipoComida: info.comida.tipo,
      nombreComida: info.comida.nombre,
      cumplimiento,
      nota: notaLimpia || undefined,
      creadoEn: new Date().toISOString(),
    });

    void this.#router.navigate(['/paciente/hoy']);
  }

  volverAHoy(): void {
    void this.#router.navigate(['/paciente/hoy']);
  }
}

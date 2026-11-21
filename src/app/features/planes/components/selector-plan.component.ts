import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { PlantillaPlan } from '../../../core/api/seed-data';

/**
 * Componente presentacional para elegir una de las 3 plantillas semilla y confirmar la asignación
 * al paciente (guardado pesimista con confirmación para reemplazar el plan activo).
 */
@Component({
  selector: 'app-selector-plan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="selector-plan" aria-labelledby="titulo-asignar-plan">
      <header class="selector-plan__header">
        <h3 id="titulo-asignar-plan" class="selector-plan__titulo">
          Asignar plantilla de plan nutricional
        </h3>
        <p class="selector-plan__sub">
          Selecciona una de las tres plantillas clínicas estandarizadas y confirma el reemplazo del plan actual.
        </p>
      </header>

      @if (mensajeExito()) {
        <div class="selector-plan__banner selector-plan__banner--exito" role="status" aria-live="polite">
          {{ mensajeExito() }}
        </div>
      }

      @if (mensajeError()) {
        <div class="selector-plan__banner selector-plan__banner--error" role="alert">
          {{ mensajeError() }}
        </div>
      }

      <div class="selector-plan__grid" role="radiogroup" aria-label="Plantillas de plan disponibles">
        @for (pl of plantillas(); track pl.id) {
          <article
            class="plantilla-card"
            [class.plantilla-card--seleccionada]="plantillaElegidaId() === pl.id"
          >
            <div class="plantilla-card__top">
              <div>
                <h4 class="plantilla-card__nombre">{{ pl.nombre }}</h4>
                @if (pl.id === planActivoId()) {
                  <span class="plantilla-card__badge">Plan activo actualmente</span>
                }
              </div>
              <span class="plantilla-card__kcal nr-tabular-nums">
                {{ pl.kcalEstimadas }} kcal
              </span>
            </div>

            <p class="plantilla-card__obj">{{ pl.objetivoClinico }}</p>

            <ul class="plantilla-card__comidas">
              @for (c of pl.comidas; track c.tipo) {
                <li>
                  <strong>{{ c.nombre }} ({{ c.horarioSugerido }}):</strong>
                  {{ c.descripcion }}
                </li>
              }
            </ul>

            <button
              type="button"
              class="plantilla-card__btn"
              [attr.aria-pressed]="plantillaElegidaId() === pl.id"
              (click)="seleccionarPlantilla(pl.id)"
            >
              {{
                plantillaElegidaId() === pl.id
                  ? '✓ Plantilla seleccionada'
                  : 'Elegir esta plantilla'
              }}
            </button>
          </article>
        }
      </div>

      <footer class="selector-plan__footer">
        @if (!pidiendoConfirmacionReemplazo()) {
          <button
            type="button"
            class="btn-asignar-primario"
            [disabled]="guardando() || !plantillaElegidaId()"
            (click)="pidiendoConfirmacionReemplazo.set(true)"
          >
            {{ guardando() ? 'Guardando plan…' : 'Confirmar y asignar plan seleccionado' }}
          </button>
        } @else {
          <div class="confirmacion-reemplazo" role="alert">
            <span>
              ¿Reemplazar el plan activo del paciente por la plantilla seleccionada?
            </span>
            <button
              type="button"
              class="btn-asignar-primario"
              [disabled]="guardando()"
              (click)="confirmarAsignacion()"
            >
              {{ guardando() ? 'Asignando…' : 'Sí, asignar plan' }}
            </button>
            <button
              type="button"
              class="btn-asignar-secundario"
              (click)="pidiendoConfirmacionReemplazo.set(false)"
            >
              Cancelar
            </button>
          </div>
        }
      </footer>
    </section>
  `,
  styles: `
    .selector-plan {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .selector-plan__titulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .selector-plan__sub {
      margin: var(--nr-space-1) 0 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .selector-plan__banner {
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-card);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }

    .selector-plan__banner--exito {
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
      border: 1px solid var(--nr-color-adherence-good);
    }

    .selector-plan__banner--error {
      background-color: var(--nr-color-feedback-error-bg);
      color: var(--nr-color-feedback-error);
      border: 1px solid var(--nr-color-feedback-error);
    }

    .selector-plan__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--nr-space-4);
    }

    .plantilla-card {
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      background-color: var(--nr-surface-background);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--nr-space-2);
    }

    .plantilla-card--seleccionada {
      border: 2px solid var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
    }

    .plantilla-card__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--nr-space-2);
    }

    .plantilla-card__nombre {
      margin: 0;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-primary);
    }

    .plantilla-card__badge {
      display: inline-block;
      margin-top: 4px;
      font-size: 12px;
      font-weight: 700;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
    }

    .plantilla-card__kcal {
      font-size: var(--nr-font-size-sm);
      font-weight: 700;
      color: var(--nr-color-data-neutral);
      white-space: nowrap;
    }

    .plantilla-card__obj {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .plantilla-card__comidas {
      margin: 0;
      padding-left: var(--nr-space-4);
      font-size: 13px;
      color: var(--nr-text-secondary);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .plantilla-card__btn {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 1px solid var(--nr-border);
      background-color: var(--nr-surface-card);
      color: var(--nr-text-primary);
      font-size: var(--nr-font-size-sm);
      font-weight: 700;
      cursor: pointer;
    }

    .selector-plan__footer {
      display: flex;
      align-items: center;
      gap: var(--nr-space-4);
      padding-top: var(--nr-space-2);
    }

    .btn-asignar-primario {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-6);
      border-radius: var(--nr-radius-button);
      border: none;
      background-color: var(--nr-color-action-primary);
      color: var(--nr-text-inverse);
      font-size: var(--nr-font-size-base);
      font-weight: 700;
      cursor: pointer;
    }

    .btn-asignar-primario:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-asignar-secundario {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 1px solid var(--nr-border);
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      cursor: pointer;
    }

    .confirmacion-reemplazo {
      display: flex;
      align-items: center;
      gap: var(--nr-space-2);
      flex-wrap: wrap;
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-primary);
    }
  `,
})
export class SelectorPlanComponent {
  readonly plantillas = input.required<readonly PlantillaPlan[]>();
  readonly planActivoId = input.required<string>();
  readonly guardando = input<boolean>(false);
  readonly mensajeExito = input<string>('');
  readonly mensajeError = input<string>('');

  readonly confirmarPlan = output<string>();

  readonly plantillaElegidaId = signal<string>('plan-glucemico');
  readonly pidiendoConfirmacionReemplazo = signal<boolean>(false);

  constructor() {
    effect(() => {
      const activo = this.planActivoId();
      if (activo) {
        this.plantillaElegidaId.set(activo);
      }
    });
  }

  seleccionarPlantilla(id: string): void {
    this.plantillaElegidaId.set(id);
    this.pidiendoConfirmacionReemplazo.set(false);
  }

  confirmarAsignacion(): void {
    this.pidiendoConfirmacionReemplazo.set(false);
    this.confirmarPlan.emit(this.plantillaElegidaId());
  }
}

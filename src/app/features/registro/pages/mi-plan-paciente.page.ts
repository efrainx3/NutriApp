import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RegistrosStore } from '../registros.store';

/**
 * Pantalla «Mi plan» del paciente: detalle de las 5 comidas del plan activo y sus porciones.
 */
@Component({
  selector: 'app-mi-plan-paciente-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mi-plan-page" aria-labelledby="titulo-mi-plan">
      <header class="mi-plan-page__header">
        <h1 id="titulo-mi-plan" class="mi-plan-page__titulo">Mi plan nutricional</h1>
        @if (registrosStore.planActivo(); as plan) {
          <p class="mi-plan-page__nombre">{{ plan.nombre }}</p>
          <p class="mi-plan-page__objetivo">{{ plan.objetivoClinico }}</p>
          <span class="mi-plan-page__kcal nr-tabular-nums">
            Aporte estimado: {{ plan.kcalEstimadas }} kcal/día
          </span>
        }
      </header>

      @if (registrosStore.planActivo(); as plan) {
        <div class="mi-plan-page__lista">
          @for (comida of plan.comidas; track comida.tipo) {
            <article class="mi-plan-card">
              <div class="mi-plan-card__header">
                <h2 class="mi-plan-card__comida">{{ comida.nombre }}</h2>
                <span class="mi-plan-card__hora nr-tabular-nums">
                  {{ comida.horarioSugerido }}
                </span>
              </div>
              <p class="mi-plan-card__desc">{{ comida.descripcion }}</p>
              <p class="mi-plan-card__porcion">
                <strong>Porciones guía:</strong> {{ comida.porcionesIdeales }}
              </p>
            </article>
          }
        </div>
      }
    </main>
  `,
  styles: `
    .mi-plan-page {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .mi-plan-page__header {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .mi-plan-page__titulo {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
    }

    .mi-plan-page__nombre {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      font-weight: 700;
      color: var(--nr-color-action-primary);
    }

    .mi-plan-page__objetivo {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .mi-plan-page__kcal {
      align-self: flex-start;
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-data-neutral-bg);
      color: var(--nr-color-data-neutral);
    }

    .mi-plan-page__lista {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .mi-plan-card {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .mi-plan-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mi-plan-card__comida {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .mi-plan-card__hora {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .mi-plan-card__desc,
    .mi-plan-card__porcion {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }
  `,
})
export class MiPlanPacientePageComponent {
  readonly registrosStore = inject(RegistrosStore);
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PacienteResumen } from '../../../core/api/seed-data';

/**
 * Componente presentacional de la lista de pacientes a la izquierda del panel profesional.
 * Muestra el buscador, la etiqueta «Requiere atención» para quienes bajaron su adherencia
 * y es 100 % operable con teclado.
 */
@Component({
  selector: 'app-lista-pacientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="lista-pacientes" aria-label="Directorio de pacientes">
      <div class="lista-pacientes__buscador">
        <label for="input-buscar-paciente" class="lista-pacientes__label">
          Buscar paciente por nombre o diagnóstico
        </label>
        <input
          id="input-buscar-paciente"
          type="search"
          class="lista-pacientes__input"
          placeholder="Ej. Jorge, prediabetes, Elena…"
          [value]="terminoBusqueda()"
          (input)="alEscribirBusqueda($event)"
        />
      </div>

      <ul class="lista-pacientes__ul" role="listbox" aria-label="Pacientes ordenados por prioridad de adherencia">
        @for (pac of pacientes(); track pac.id) {
          <li class="lista-pacientes__li" role="option" [attr.aria-selected]="pac.id === seleccionadoId()">
            <button
              type="button"
              class="paciente-item"
              [class.paciente-item--activo]="pac.id === seleccionadoId()"
              (click)="seleccionarPaciente.emit(pac.id)"
            >
              <div class="paciente-item__fila-top">
                <span class="paciente-item__nombre">{{ pac.nombre }}</span>
                @if (pac.adherenciaTendenciaBaja) {
                  <span class="paciente-item__alerta">Requiere atención</span>
                }
              </div>

              <span class="paciente-item__diag">{{ pac.diagnostico }}</span>

              <div class="paciente-item__kpis nr-tabular-nums">
                <span
                  class="paciente-item__adherencia"
                  [class.paciente-item__adherencia--baja]="pac.adherenciaTendenciaBaja"
                >
                  Adherencia: {{ pac.adherenciaActual }} %
                </span>
                <span>Peso: {{ pac.pesoActualKg }} kg</span>
              </div>
            </button>
          </li>
        } @empty {
          <li class="lista-pacientes__vacio">
            No se encontraron pacientes que coincidan con la búsqueda.
          </li>
        }
      </ul>
    </aside>
  `,
  styles: `
    .lista-pacientes {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
      height: 100%;
    }

    .lista-pacientes__buscador {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .lista-pacientes__label {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .lista-pacientes__input {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border: 1px solid var(--nr-border);
      border-radius: var(--nr-radius-card);
      font-size: var(--nr-font-size-base);
      font-family: var(--nr-font-sans);
      color: var(--nr-text-primary);
    }

    .lista-pacientes__ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .paciente-item {
      width: 100%;
      padding: var(--nr-space-4);
      border-radius: var(--nr-radius-card);
      border: 1px solid var(--nr-border-subtle);
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
      cursor: pointer;
    }

    .paciente-item:hover {
      border-color: var(--nr-color-action-primary);
    }

    .paciente-item--activo {
      background-color: var(--nr-color-action-primary-subtle);
      border: 2px solid var(--nr-color-action-primary);
    }

    .paciente-item__fila-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--nr-space-2);
      flex-wrap: wrap;
    }

    .paciente-item__nombre {
      font-size: var(--nr-font-size-base);
      font-weight: 700;
    }

    .paciente-item__alerta {
      font-size: 12px;
      font-weight: 700;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
      border: 1px solid var(--nr-color-adherence-partial);
    }

    .paciente-item__diag {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .paciente-item__kpis {
      display: flex;
      justify-content: space-between;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      margin-top: var(--nr-space-1);
    }

    .paciente-item__adherencia {
      font-weight: 600;
      color: var(--nr-color-adherence-good);
    }

    .paciente-item__adherencia--baja {
      color: var(--nr-color-adherence-partial);
    }

    .lista-pacientes__vacio {
      padding: var(--nr-space-4);
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }
  `,
})
export class ListaPacientesComponent {
  readonly pacientes = input.required<readonly PacienteResumen[]>();
  readonly seleccionadoId = input.required<string>();
  readonly terminoBusqueda = input<string>('');
  readonly buscar = output<string>();
  readonly seleccionarPaciente = output<string>();

  alEscribirBusqueda(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.buscar.emit(el.value);
  }
}

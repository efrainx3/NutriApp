import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RegistroComida } from '../../../core/api/seed-data';
import { AvisoEstadoComponent } from '../../../shared/ui/aviso-estado/aviso-estado.component';

/**
 * Componente presentacional que muestra en la pestaña «Registros» de la ficha del nutricionista
 * todos los registros diarios del paciente (incluyendo los recién creados por el paciente).
 */
@Component({
  selector: 'app-tabla-registros-paciente',
  standalone: true,
  imports: [AvisoEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="registros-ficha" aria-labelledby="titulo-registros-paciente">
      <header class="registros-ficha__header">
        <h3 id="titulo-registros-paciente" class="registros-ficha__titulo">
          Historial de registros diarios del paciente ({{ registros().length }})
        </h3>
        <p class="registros-ficha__sub">
          Refleja en tiempo real lo que el paciente reporta desde su aplicación móvil.
        </p>
      </header>

      <div class="registros-ficha__tabla-wrap">
        <table class="registros-ficha__tabla">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Comida</th>
              <th scope="col">Cumplimiento</th>
              <th scope="col">Nota del paciente</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (reg of registros(); track reg.id) {
              <tr>
                <td class="nr-tabular-nums">{{ reg.fecha }}</td>
                <td><strong>{{ reg.nombreComida }}</strong></td>
                <td>
                  <span
                    class="badge-cumplimiento"
                    [class.badge-cumplimiento--completo]="reg.cumplimiento === 'completo'"
                    [class.badge-cumplimiento--parcial]="reg.cumplimiento === 'parcial'"
                  >
                    @switch (reg.cumplimiento) {
                      @case ('completo') {
                        Sí, completo
                      }
                      @case ('parcial') {
                        Parcialmente
                      }
                      @default {
                        No seguido
                      }
                    }
                  </span>
                </td>
                <td>{{ reg.nota || '—' }}</td>
                <td>
                  <app-aviso-estado
                    modo="insignia"
                    [estado]="reg.estadoSincronizacion"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">Este paciente aún no tiene registros de comidas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    .registros-ficha {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .registros-ficha__titulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .registros-ficha__sub {
      margin: var(--nr-space-1) 0 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .registros-ficha__tabla-wrap {
      overflow-x: auto;
    }

    .registros-ficha__tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--nr-font-size-sm);
    }

    .registros-ficha__tabla th,
    .registros-ficha__tabla td {
      padding: var(--nr-space-2) var(--nr-space-4);
      border-bottom: 1px solid var(--nr-border-subtle);
      text-align: left;
    }

    .registros-ficha__tabla th {
      background-color: var(--nr-surface-background);
      font-weight: 700;
      color: var(--nr-text-primary);
    }

    .badge-cumplimiento {
      display: inline-block;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      font-weight: 600;
      background-color: var(--nr-surface-background);
      color: var(--nr-text-secondary);
    }

    .badge-cumplimiento--completo {
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
    }

    .badge-cumplimiento--parcial {
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
    }
  `,
})
export class TablaRegistrosPacienteComponent {
  readonly registros = input.required<readonly RegistroComida[]>();
}

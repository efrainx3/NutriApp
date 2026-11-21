import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TipoComida } from '../../../core/api/seed-data';
import { AvisoEstadoComponent } from '../../../shared/ui/aviso-estado/aviso-estado.component';
import { TarjetaComidaHoy } from '../registros.store';

/**
 * Tarjeta presentacional de una comida del plan del día (máximo 5 tarjetas en Hoy).
 * No inyecta stores ni servicios.
 */
@Component({
  selector: 'app-tarjeta-comida-dia',
  standalone: true,
  imports: [AvisoEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="tarjeta-comida" [attr.aria-label]="item().comida.nombre">
      <div class="tarjeta-comida__top">
        <div>
          <span class="tarjeta-comida__hora nr-tabular-nums">
            {{ item().comida.horarioSugerido }}
          </span>
          <h3 class="tarjeta-comida__nombre">{{ item().comida.nombre }}</h3>
        </div>

        <app-aviso-estado
          modo="insignia"
          [estado]="item().estadoSincronizacion"
        />
      </div>

      <p class="tarjeta-comida__desc">{{ item().comida.descripcion }}</p>

      @if (item().registro; as reg) {
        <div class="tarjeta-comida__resumen-reg">
          <span class="tarjeta-comida__cumplimiento">
            @switch (reg.cumplimiento) {
              @case ('completo') {
                Cumplimiento: Sí, completo
              }
              @case ('parcial') {
                Cumplimiento: Parcialmente
              }
              @default {
                Cumplimiento: No lo seguí
              }
            }
          </span>
          @if (reg.nota) {
            <span class="tarjeta-comida__nota">«{{ reg.nota }}»</span>
          }
        </div>
      }

      <button
        type="button"
        class="tarjeta-comida__btn"
        (click)="seleccionar.emit(item().comida.tipo)"
      >
        {{
          item().registro
            ? 'Actualizar ' + item().comida.nombre.toLowerCase()
            : 'Registrar ' + item().comida.nombre.toLowerCase()
        }}
      </button>
    </article>
  `,
  styles: `
    .tarjeta-comida {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .tarjeta-comida__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--nr-space-2);
    }

    .tarjeta-comida__hora {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .tarjeta-comida__nombre {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .tarjeta-comida__desc {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .tarjeta-comida__resumen-reg {
      padding: var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-surface-background);
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: var(--nr-font-size-sm);
    }

    .tarjeta-comida__cumplimiento {
      font-weight: 600;
      color: var(--nr-text-primary);
    }

    .tarjeta-comida__nota {
      color: var(--nr-text-secondary);
      font-style: italic;
    }

    .tarjeta-comida__btn {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 1px solid var(--nr-border);
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      cursor: pointer;
      align-self: flex-start;
    }

    .tarjeta-comida__btn:hover {
      border-color: var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
    }
  `,
})
export class TarjetaComidaDiaComponent {
  readonly item = input.required<TarjetaComidaHoy>();
  readonly seleccionar = output<TipoComida>();
}

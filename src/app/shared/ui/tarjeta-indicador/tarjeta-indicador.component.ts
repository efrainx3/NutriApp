import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type VarianteIndicador = 'neutral' | 'good' | 'partial';

/**
 * Componente presentacional puro para mostrar un indicador clave (IMC, cambio de peso,
 * adherencia, próximo control). No inyecta stores ni servicios.
 */
@Component({
  selector: 'app-tarjeta-indicador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="tarjeta-indicador"
      [class.tarjeta-indicador--neutral]="variante() === 'neutral'"
      [class.tarjeta-indicador--good]="variante() === 'good'"
      [class.tarjeta-indicador--partial]="variante() === 'partial'"
      [attr.aria-label]="etiqueta() + ': ' + valor()"
    >
      <header class="tarjeta-indicador__header">
        <span class="tarjeta-indicador__etiqueta">{{ etiqueta() }}</span>
        @if (insignia()) {
          <span class="tarjeta-indicador__insignia">{{ insignia() }}</span>
        }
      </header>

      <div class="tarjeta-indicador__cuerpo">
        <span class="tarjeta-indicador__valor nr-tabular-nums">{{ valor() }}</span>
        @if (unidad()) {
          <span class="tarjeta-indicador__unidad">{{ unidad() }}</span>
        }
      </div>

      @if (detalle()) {
        <p class="tarjeta-indicador__detalle">{{ detalle() }}</p>
      }
    </article>
  `,
  styles: `
    .tarjeta-indicador {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-left: 4px solid var(--nr-color-data-neutral);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .tarjeta-indicador--neutral {
      border-left-color: var(--nr-color-data-neutral);
    }

    .tarjeta-indicador--good {
      border-left-color: var(--nr-color-adherence-good);
    }

    .tarjeta-indicador--partial {
      border-left-color: var(--nr-color-adherence-partial);
    }

    .tarjeta-indicador__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--nr-space-2);
    }

    .tarjeta-indicador__etiqueta {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .tarjeta-indicador__insignia {
      font-size: var(--nr-font-size-sm);
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-data-neutral-bg);
      color: var(--nr-text-primary);
      font-weight: 600;
    }

    .tarjeta-indicador__cuerpo {
      display: flex;
      align-items: baseline;
      gap: var(--nr-space-1);
    }

    .tarjeta-indicador__valor {
      font-size: var(--nr-font-size-xl);
      font-weight: 700;
      color: var(--nr-text-primary);
      line-height: var(--nr-line-height-heading);
    }

    .tarjeta-indicador__unidad {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .tarjeta-indicador__detalle {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }
  `,
})
export class TarjetaIndicadorComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly unidad = input<string>('');
  readonly detalle = input<string>('');
  readonly insignia = input<string>('');
  readonly variante = input<VarianteIndicador>('neutral');
}

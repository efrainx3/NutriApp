import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NivelCumplimiento } from '../../util/calculos';

export interface OpcionCumplimiento {
  readonly valor: NivelCumplimiento;
  readonly etiqueta: string;
  readonly descripcion: string;
}

/**
 * Botón presentacional de cumplimiento táctil (mínimo 44x44 px) para el registro en un toque.
 */
@Component({
  selector: 'app-boton-cumplimiento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="opciones-cumplimiento" role="group" aria-label="Opciones de cumplimiento de la comida">
      @for (op of opciones; track op.valor) {
        <button
          type="button"
          class="boton-cumplimiento"
          [class.boton-cumplimiento--seleccionado]="seleccionado() === op.valor"
          [class.boton-cumplimiento--completo]="op.valor === 'completo'"
          [class.boton-cumplimiento--parcial]="op.valor === 'parcial'"
          [attr.aria-pressed]="seleccionado() === op.valor"
          (click)="elegir.emit(op.valor)"
        >
          <span class="boton-cumplimiento__etiqueta">{{ op.etiqueta }}</span>
          <span class="boton-cumplimiento__desc">{{ op.descripcion }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .opciones-cumplimiento {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .boton-cumplimiento {
      min-height: 56px;
      min-width: 44px;
      width: 100%;
      padding: var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 2px solid var(--nr-border);
      background-color: var(--nr-surface-card);
      color: var(--nr-text-primary);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--nr-space-1);
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .boton-cumplimiento:hover {
      border-color: var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
    }

    .boton-cumplimiento--seleccionado {
      border-color: var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
    }

    .boton-cumplimiento__etiqueta {
      font-size: var(--nr-font-size-base);
      font-weight: 700;
      color: var(--nr-text-primary);
    }

    .boton-cumplimiento__desc {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }
  `,
})
export class BotonCumplimientoComponent {
  readonly seleccionado = input<NivelCumplimiento | null>(null);
  readonly elegir = output<NivelCumplimiento>();

  readonly opciones: readonly OpcionCumplimiento[] = [
    {
      valor: 'completo',
      etiqueta: 'Sí, completo',
      descripcion: 'Seguí las porciones e indicaciones del plan',
    },
    {
      valor: 'parcial',
      etiqueta: 'Parcialmente',
      descripcion: 'Incluí parte de la recomendación o hice ajustes',
    },
    {
      valor: 'no-seguido',
      etiqueta: 'No lo seguí',
      descripcion: 'Hoy comí diferente a lo sugerido en esta comida',
    },
  ];
}

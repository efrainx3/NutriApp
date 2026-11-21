import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type EstadoSincronizacion = 'pendiente' | 'sincronizado' | 'en-cola' | 'sin-registrar';

/**
 * Componente presentacional para notificaciones con aria-live="polite" y etiquetas
 * visibles de estado de sincronización (pendiente, sincronizado, en cola).
 */
@Component({
  selector: 'app-aviso-estado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modo() === 'insignia') {
      <span
        class="insignia-estado"
        [class.insignia-estado--sincronizado]="estado() === 'sincronizado'"
        [class.insignia-estado--pendiente]="estado() === 'pendiente'"
        [class.insignia-estado--en-cola]="estado() === 'en-cola'"
        [class.insignia-estado--sin-registrar]="estado() === 'sin-registrar'"
      >
        @switch (estado()) {
          @case ('sincronizado') {
            ✓ Sincronizado
          }
          @case ('pendiente') {
            ⟳ Pendiente…
          }
          @case ('en-cola') {
            ◷ En cola (sin conexión)
          }
          @default {
            Hoy no registraste aún
          }
        }
      </span>
    } @else {
      <div
        class="aviso-banner"
        [class.aviso-banner--error]="esError()"
        [class.aviso-banner--cola]="estado() === 'en-cola'"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (mensaje()) {
          <p class="aviso-banner__texto">{{ mensaje() }}</p>
        }
      </div>
    }
  `,
  styles: `
    .insignia-estado {
      display: inline-flex;
      align-items: center;
      gap: var(--nr-space-1);
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      border: 1px solid var(--nr-border-subtle);
    }

    .insignia-estado--sincronizado {
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
    }

    .insignia-estado--pendiente {
      background-color: var(--nr-color-data-neutral-bg);
      color: var(--nr-color-data-neutral);
    }

    .insignia-estado--en-cola {
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
    }

    .insignia-estado--sin-registrar {
      background-color: var(--nr-surface-background);
      color: var(--nr-text-secondary);
    }

    .aviso-banner {
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-2) var(--nr-space-4);
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
      border: 1px solid var(--nr-color-adherence-good);
      min-height: 24px;
    }

    .aviso-banner:empty {
      display: none;
    }

    .aviso-banner--cola {
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
      border-color: var(--nr-color-adherence-partial);
    }

    .aviso-banner--error {
      background-color: var(--nr-color-feedback-error-bg);
      color: var(--nr-color-feedback-error);
      border-color: var(--nr-color-feedback-error);
    }

    .aviso-banner__texto {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }
  `,
})
export class AvisoEstadoComponent {
  readonly modo = input<'insignia' | 'banner'>('insignia');
  readonly estado = input<EstadoSincronizacion>('sin-registrar');
  readonly mensaje = input<string>('');
  readonly esError = input<boolean>(false);
}

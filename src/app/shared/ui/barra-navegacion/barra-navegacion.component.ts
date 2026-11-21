import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface DestinoNavegacion {
  readonly ruta: string;
  readonly etiqueta: string;
  readonly icono: string;
}

/**
 * Barra inferior de navegación para la app móvil del paciente (4 destinos: Hoy, Mi plan, Progreso, Perfil).
 * Se oculta durante el flujo de registro de una comida para evitar distracciones.
 */
@Component({
  selector: 'app-barra-navegacion',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!oculta()) {
      <nav class="barra-nav" aria-label="Navegación principal del paciente">
        <ul class="barra-nav__lista">
          @for (item of destinos(); track item.ruta) {
            <li class="barra-nav__item">
              <a
                [routerLink]="item.ruta"
                routerLinkActive="barra-nav__enlace--activo"
                [routerLinkActiveOptions]="{ exact: true }"
                class="barra-nav__enlace"
              >
                <span class="barra-nav__icono" aria-hidden="true">{{ item.icono }}</span>
                <span class="barra-nav__etiqueta">{{ item.etiqueta }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: `
    .barra-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--nr-surface-card);
      border-top: 1px solid var(--nr-border);
      z-index: 100;
    }

    .barra-nav__lista {
      list-style: none;
      margin: 0 auto;
      padding: 0;
      max-width: 480px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }

    .barra-nav__item {
      display: flex;
    }

    .barra-nav__enlace {
      width: 100%;
      min-height: 56px;
      min-width: 44px;
      padding: var(--nr-space-2) var(--nr-space-1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-decoration: none;
      color: var(--nr-text-secondary);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }

    .barra-nav__enlace--activo {
      color: var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
      border-top: 3px solid var(--nr-color-action-primary);
    }

    .barra-nav__icono {
      font-size: 18px;
      line-height: 1;
    }
  `,
})
export class BarraNavegacionComponent {
  readonly destinos = input.required<readonly DestinoNavegacion[]>();
  readonly oculta = input<boolean>(false);
}

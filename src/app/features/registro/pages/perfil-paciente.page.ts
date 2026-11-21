import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { SessionEvents } from '../../../core/auth/session.events';
import { SessionStore } from '../../../core/auth/session.store';
import { RegistrosStore } from '../registros.store';

/**
 * Pantalla «Perfil» del paciente con resumen de privacidad (Ley 1581 de 2012)
 * y cierre de sesión con advertencia si existen registros pendientes en la cola offline.
 */
@Component({
  selector: 'app-perfil-paciente-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="perfil-page" aria-labelledby="titulo-perfil">
      <header class="perfil-page__header">
        <h1 id="titulo-perfil" class="perfil-page__titulo">Mi perfil</h1>
        <p class="perfil-page__sub">
          Datos en sesión activa y garantías de privacidad (Ley 1581 de 2012).
        </p>
      </header>

      @if (registrosStore.paciente(); as pac) {
        <section class="perfil-card" aria-label="Información del paciente">
          <div class="perfil-card__fila">
            <span class="perfil-card__etiqueta">Nombre</span>
            <strong class="perfil-card__valor">{{ pac.nombre }} ({{ pac.edad }} años)</strong>
          </div>
          <div class="perfil-card__fila">
            <span class="perfil-card__etiqueta">Contexto clínico</span>
            <span class="perfil-card__valor">{{ pac.diagnostico }}</span>
          </div>
          <div class="perfil-card__fila">
            <span class="perfil-card__etiqueta">Próximo control con Dra. Camila</span>
            <span class="perfil-card__valor nr-tabular-nums">{{ pac.proximoControl }}</span>
          </div>
          <div class="perfil-card__fila">
            <span class="perfil-card__etiqueta">Consentimiento Ley 1581</span>
            <span class="perfil-card__valor">
              Activo en memoria ({{ sessionStore.fechaConsentimiento() ? 'Otorgado' : 'Pendiente' }})
            </span>
          </div>
        </section>
      }

      <section class="perfil-card" aria-label="Privacidad y cierre de sesión">
        <h2 class="perfil-card__subtitulo">Protección de datos sensibles</h2>
        <p class="perfil-card__texto">
          Tu historia clínica nunca se almacena en el navegador. Los registros hechos sin conexión se borran de IndexedDB al sincronizar o al cerrar sesión.
        </p>

        @if (confirmandoCierreConCola()) {
          <div class="perfil-card__alerta" role="alert">
            <p class="perfil-card__alerta-texto">
              Tienes {{ registrosStore.cantidadEnCola() }} registro(s) en cola sin sincronizar. Si cierras sesión ahora, se borrarán del dispositivo por privacidad.
            </p>
            <div class="perfil-card__alerta-botones">
              <button
                type="button"
                class="btn-perfil btn-perfil--peligro"
                (click)="confirmarCerrarSesion()"
              >
                Cerrar sesión y borrar cola
              </button>
              <button
                type="button"
                class="btn-perfil"
                (click)="confirmandoCierreConCola.set(false)"
              >
                Cancelar
              </button>
            </div>
          </div>
        } @else {
          <button
            type="button"
            class="btn-perfil"
            (click)="solicitarCerrarSesion()"
          >
            Cerrar sesión
          </button>
        }
      </section>
    </main>
  `,
  styles: `
    .perfil-page {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .perfil-page__header {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .perfil-page__titulo {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
    }

    .perfil-page__sub {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .perfil-card {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .perfil-card__fila {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: var(--nr-space-2);
      border-bottom: 1px solid var(--nr-border-subtle);
    }

    .perfil-card__fila:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .perfil-card__etiqueta {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .perfil-card__valor {
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-primary);
    }

    .perfil-card__subtitulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .perfil-card__texto {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .perfil-card__alerta {
      background-color: var(--nr-color-feedback-error-bg);
      border: 1px solid var(--nr-color-feedback-error);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .perfil-card__alerta-texto {
      margin: 0;
      color: var(--nr-color-feedback-error);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }

    .perfil-card__alerta-botones {
      display: flex;
      gap: var(--nr-space-2);
      flex-wrap: wrap;
    }

    .btn-perfil {
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

    .btn-perfil--peligro {
      background-color: var(--nr-color-feedback-error);
      color: var(--nr-text-inverse);
      border-color: var(--nr-color-feedback-error);
    }
  `,
})
export class PerfilPacientePageComponent {
  readonly sessionStore = inject(SessionStore);
  readonly registrosStore = inject(RegistrosStore);
  readonly #dispatchSession = injectDispatch(SessionEvents);

  readonly confirmandoCierreConCola = signal<boolean>(false);

  solicitarCerrarSesion(): void {
    if (this.registrosStore.cantidadEnCola() > 0) {
      this.confirmandoCierreConCola.set(true);
      return;
    }
    this.#dispatchSession.sesionCerrada();
  }

  confirmarCerrarSesion(): void {
    this.confirmandoCierreConCola.set(false);
    this.#dispatchSession.sesionCerrada();
  }
}

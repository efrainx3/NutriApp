import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { RolUsuario } from '../api/seed-data';
import { SessionEvents } from './session.events';

/**
 * Pantalla de inicio de sesión simulado con consentimiento obligatorio de tratamiento
 * de datos sensibles de salud (Ley 1581 de 2012, Colombia).
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login-layout">
      <section class="login-card" aria-labelledby="titulo-login">
        <header class="login-card__header">
          <span class="login-card__badge">Plataforma Académica — Arquitectura Flux</span>
          <h1 id="titulo-login" class="login-card__titulo">NutriRuta</h1>
          <p class="login-card__subtitulo">
            Acompañamiento nutricional continuo entre consultas: registro diario en menos de 60 segundos y seguimiento clínico basado en datos.
          </p>
        </header>

        <div class="login-card__consentimiento">
          <label class="consentimiento-label" for="chk-consentimiento">
            <input
              id="chk-consentimiento"
              type="checkbox"
              class="consentimiento-checkbox"
              [checked]="consentimientoMarcado()"
              (change)="alternarConsentimiento($event)"
              aria-describedby="desc-ley-1581"
            />
            <span>
              Autorizo el tratamiento de mis datos sensibles de salud conforme a la
              <strong>Ley 1581 de 2012 (Colombia)</strong>.
            </span>
          </label>
          <p id="desc-ley-1581" class="consentimiento-ayuda">
            Garantía de privacidad: tu historia clínica vive únicamente en memoria durante la sesión y nunca se almacena en localStorage, sessionStorage ni IndexedDB.
          </p>

          @if (intentoSinConsentimiento()) {
            <p class="consentimiento-error" role="alert">
              Para ingresar debes aceptar primero el consentimiento de tratamiento de datos de salud.
            </p>
          }
        </div>

        <div class="login-card__acciones">
          <button
            type="button"
            class="btn-ingreso btn-ingreso--primario"
            (click)="ingresarComo('paciente')"
          >
            <span class="btn-ingreso__titulo">Entrar como paciente (Jorge R.)</span>
            <span class="btn-ingreso__meta">
              Experiencia móvil (375 px) · Prediabetes · Registro en un toque
            </span>
          </button>

          <button
            type="button"
            class="btn-ingreso btn-ingreso--secundario"
            (click)="ingresarComo('profesional')"
          >
            <span class="btn-ingreso__titulo">Entrar como nutricionista (Dra. Camila)</span>
            <span class="btn-ingreso__meta">
              Panel clínico de escritorio (≥1280 px) · Valoración, evolución y planes
            </span>
          </button>
        </div>
      </section>
    </main>
  `,
  styles: `
    .login-layout {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--nr-space-6) var(--nr-space-4);
    }

    .login-card {
      width: 100%;
      max-width: 560px;
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-8);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-6);
    }

    .login-card__header {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .login-card__badge {
      align-self: flex-start;
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      padding: var(--nr-space-1) var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-action-primary-subtle);
      color: var(--nr-color-action-primary);
    }

    .login-card__titulo {
      margin: 0;
      font-size: var(--nr-font-size-2xl);
      color: var(--nr-text-primary);
      line-height: var(--nr-line-height-heading);
    }

    .login-card__subtitulo {
      margin: 0;
      color: var(--nr-text-secondary);
      font-size: var(--nr-font-size-base);
    }

    .login-card__consentimiento {
      background-color: var(--nr-surface-background);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .consentimiento-label {
      display: flex;
      align-items: flex-start;
      gap: var(--nr-space-2);
      cursor: pointer;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-primary);
    }

    .consentimiento-checkbox {
      width: 22px;
      height: 22px;
      margin-top: 2px;
      accent-color: var(--nr-color-action-primary);
      cursor: pointer;
      flex-shrink: 0;
    }

    .consentimiento-ayuda {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .consentimiento-error {
      margin: 0;
      padding: var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-feedback-error-bg);
      color: var(--nr-color-feedback-error);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }

    .login-card__acciones {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .btn-ingreso {
      width: 100%;
      min-height: var(--nr-button-cta-height);
      padding: var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--nr-space-1);
      cursor: pointer;
      text-align: left;
      transition: transform 0.1s ease;
    }

    .btn-ingreso--primario {
      background-color: var(--nr-color-action-primary);
      color: var(--nr-text-inverse);
      border: 2px solid var(--nr-color-action-primary);
    }

    .btn-ingreso--primario:hover {
      background-color: var(--nr-color-action-primary-hover);
    }

    .btn-ingreso--secundario {
      background-color: var(--nr-surface-card);
      color: var(--nr-text-primary);
      border: 2px solid var(--nr-border);
    }

    .btn-ingreso--secundario:hover {
      border-color: var(--nr-color-action-primary);
      background-color: var(--nr-color-action-primary-subtle);
    }

    .btn-ingreso__titulo {
      font-size: var(--nr-font-size-lg);
      font-weight: 700;
    }

    .btn-ingreso__meta {
      font-size: var(--nr-font-size-sm);
      opacity: 0.92;
    }
  `,
})
export class LoginPageComponent {
  readonly #dispatchSession = injectDispatch(SessionEvents);

  /** Estado efímero local del formulario de login */
  readonly consentimientoMarcado = signal<boolean>(false);
  readonly intentoSinConsentimiento = signal<boolean>(false);

  alternarConsentimiento(evento: Event): void {
    const inputEl = evento.target as HTMLInputElement;
    this.consentimientoMarcado.set(inputEl.checked);
    if (inputEl.checked) {
      this.intentoSinConsentimiento.set(false);
    }
  }

  ingresarComo(rol: RolUsuario): void {
    if (!this.consentimientoMarcado()) {
      this.intentoSinConsentimiento.set(true);
      return;
    }

    this.#dispatchSession.sesionIniciada({
      rol,
      consentimientoAceptado: true,
    });
  }
}

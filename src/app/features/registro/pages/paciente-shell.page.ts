import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { SessionStore } from '../../../core/auth/session.store';
import {
  BarraNavegacionComponent,
  DestinoNavegacion,
} from '../../../shared/ui/barra-navegacion/barra-navegacion.component';
import { EvolucionPageEvents } from '../../evolucion/evolucion.events';
import { RegistroPageEvents } from '../registro.events';

/**
 * Contenedor mobile-first (ancho base 375 px) para la experiencia del paciente (Jorge R.).
 * Oculta la barra inferior de navegación cuando está en la pantalla de registro de una comida.
 */
@Component({
  selector: 'app-paciente-shell-page',
  standalone: true,
  imports: [RouterOutlet, BarraNavegacionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="paciente-shell">
      <div class="paciente-shell__contenido">
        <router-outlet />
      </div>

      <app-barra-navegacion
        [destinos]="destinos"
        [oculta]="enModoRegistroComida()"
      />
    </div>
  `,
  styles: `
    .paciente-shell {
      max-width: 440px;
      min-width: 320px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
      padding-bottom: 84px;
      background-color: var(--nr-surface-background);
    }

    .paciente-shell__contenido {
      padding: var(--nr-space-4);
    }
  `,
})
export class PacienteShellPageComponent implements OnInit {
  readonly #router = inject(Router);
  readonly #sessionStore = inject(SessionStore);
  readonly #dispatchRegistro = injectDispatch(RegistroPageEvents);
  readonly #dispatchEvolucion = injectDispatch(EvolucionPageEvents);

  readonly destinos: readonly DestinoNavegacion[] = [
    { ruta: '/paciente/hoy', etiqueta: 'Hoy', icono: '☀' },
    { ruta: '/paciente/mi-plan', etiqueta: 'Mi plan', icono: '🥗' },
    { ruta: '/paciente/progreso', etiqueta: 'Progreso', icono: '📈' },
    { ruta: '/paciente/perfil', etiqueta: 'Perfil', icono: '👤' },
  ];

  readonly rutaActual = signal<string>(this.#router.url);

  constructor() {
    this.#router.events.subscribe(() => {
      this.rutaActual.set(this.#router.url);
    });
  }

  ngOnInit(): void {
    const pacienteId = this.#sessionStore.pacienteActivoId();
    this.#dispatchRegistro.hoyAbierta({ pacienteId });
    this.#dispatchEvolucion.evolucionSolicitada({ pacienteId });
  }

  enModoRegistroComida(): boolean {
    return this.rutaActual().includes('/paciente/registrar/');
  }
}

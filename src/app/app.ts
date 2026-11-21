import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { SessionEvents } from './core/auth/session.events';
import { SessionStore } from './core/auth/session.store';
import { ConnectivityService } from './core/offline/connectivity.service';
import { RegistrosStore } from './features/registro/registros.store';

/**
 * Componente raíz de NutriRuta:
 * Incluye la barra superior global con:
 * - Identificación del rol activo en memoria.
 * - Interruptor manual «Simular sin conexión» (para demostrar la cola offline IndexedDB en el video).
 * - Interruptor «Forzar error API» (para demostrar `registroFallido` y reversión optimista).
 * - Botón «Cerrar sesión» con confirmación si hay registros pendientes en la cola offline.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly sessionStore = inject(SessionStore);
  readonly connectivity = inject(ConnectivityService);
  readonly registrosStore = inject(RegistrosStore);
  readonly #dispatchSession = injectDispatch(SessionEvents);

  readonly confirmandoCierreConCola = signal<boolean>(false);

  alternarOffline(): void {
    this.connectivity.alternarSimulacionSinConexion();
  }

  alternarErrorPost(): void {
    this.connectivity.alternarForzarErrorPostRegistro();
  }

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

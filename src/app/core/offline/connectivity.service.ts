import { computed, inject, Injectable, signal } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { RedEvents } from './red.events';

/**
 * Servicio que combina navigator.onLine con:
 * 1) Interruptor manual «Simular sin conexión» en la barra superior (para la demostración en video).
 * 2) Interruptor «Forzar error API POST /registros» para demostrar registroFallido.
 *
 * Al desactivar «Simular sin conexión» (o recuperar la red real), despacha el evento
 * `conexionRecuperada` para que el manejador reenvíe la cola FIFO de IndexedDB.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly #dispatcher = inject(Dispatcher);

  readonly #navegadorOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  readonly #simularSinConexion = signal<boolean>(false);
  readonly #forzarErrorPostRegistro = signal<boolean>(false);

  /** Latencia configurable del mock backend (300–800 ms en uso normal; 0 ms en tests) */
  readonly #latenciaMs = signal<number>(350);

  readonly simularSinConexion = this.#simularSinConexion.asReadonly();
  readonly forzarErrorPostRegistro = this.#forzarErrorPostRegistro.asReadonly();
  readonly latenciaMs = this.#latenciaMs.asReadonly();

  readonly estaConectado = computed(
    () => this.#navegadorOnline() && !this.#simularSinConexion()
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.#navegadorOnline.set(true);
        if (!this.#simularSinConexion()) {
          this.#dispatcher.dispatch(RedEvents.conexionRecuperada());
        }
      });

      window.addEventListener('offline', () => {
        this.#navegadorOnline.set(false);
        this.#dispatcher.dispatch(RedEvents.conexionPerdida());
      });
    }
  }

  alternarSimulacionSinConexion(forzarValor?: boolean): void {
    const nuevoEstado =
      forzarValor !== undefined ? forzarValor : !this.#simularSinConexion();
    const estabaConectado = this.estaConectado();

    this.#simularSinConexion.set(nuevoEstado);
    this.#dispatcher.dispatch(
      RedEvents.simulacionOfflineCambiada({ activo: nuevoEstado })
    );

    if (estabaConectado && !this.estaConectado()) {
      this.#dispatcher.dispatch(RedEvents.conexionPerdida());
    } else if (!estabaConectado && this.estaConectado()) {
      this.#dispatcher.dispatch(RedEvents.conexionRecuperada());
    }
  }

  alternarForzarErrorPostRegistro(forzarValor?: boolean): void {
    const nuevoEstado =
      forzarValor !== undefined ? forzarValor : !this.#forzarErrorPostRegistro();
    this.#forzarErrorPostRegistro.set(nuevoEstado);
    this.#dispatcher.dispatch(
      RedEvents.forzarErrorApiCambiado({ activo: nuevoEstado })
    );
  }

  configurarLatenciaMs(ms: number): void {
    this.#latenciaMs.set(Math.max(0, ms));
  }
}

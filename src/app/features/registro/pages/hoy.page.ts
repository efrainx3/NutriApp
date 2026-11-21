import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TipoComida } from '../../../core/api/seed-data';
import { SessionStore } from '../../../core/auth/session.store';
import { AvisoEstadoComponent } from '../../../shared/ui/aviso-estado/aviso-estado.component';
import { TarjetaIndicadorComponent } from '../../../shared/ui/tarjeta-indicador/tarjeta-indicador.component';
import { TarjetaComidaDiaComponent } from '../components/tarjeta-comida-dia.component';
import { RegistrosStore } from '../registros.store';

/**
 * Pantalla principal «Hoy» de la app del paciente:
 * - Saludo personalizado.
 * - Tarjeta de progreso semanal en lenguaje positivo («Cumpliste 5 de 7 días»).
 * - Región aria-live="polite" para confirmación inmediata o mensajes sin culpa.
 * - Plan del día en máximo 5 tarjetas con su estado (pendiente, sincronizado, en cola).
 * - Botón principal «Registrar hoy» de ancho completo y 56 px de alto en la zona del pulgar.
 */
@Component({
  selector: 'app-hoy-page',
  standalone: true,
  imports: [
    TarjetaIndicadorComponent,
    TarjetaComidaDiaComponent,
    AvisoEstadoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="hoy-page" aria-labelledby="titulo-saludo-paciente">
      <header class="hoy-page__header">
        <span class="hoy-page__fecha nr-tabular-nums">
          Hoy · {{ registrosStore.fechaHoy() }}
        </span>
        <h1 id="titulo-saludo-paciente" class="hoy-page__saludo">
          Hola, {{ sessionStore.nombreUsuario() || 'Jorge R.' }}
        </h1>
        <p class="hoy-page__sub">
          Registra tu día en menos de 60 segundos con un solo toque.
        </p>
      </header>

      <!-- Región aria-live="polite" para confirmación inmediata o error sin culpa -->
      @if (registrosStore.mensajeConfirmacion()) {
        <app-aviso-estado
          modo="banner"
          [estado]="registrosStore.cantidadEnCola() > 0 ? 'en-cola' : 'sincronizado'"
          [mensaje]="registrosStore.mensajeConfirmacion()"
        />
      }

      @if (registrosStore.mensajeError()) {
        <app-aviso-estado
          modo="banner"
          [esError]="true"
          [mensaje]="registrosStore.mensajeError()"
        />
      }

      <!-- Tarjeta de progreso semanal en lenguaje positivo -->
      <app-tarjeta-indicador
        etiqueta="Tu avance de esta semana"
        [valor]="registrosStore.progresoSemanal().mensajePositivo"
        [detalle]="
          'Adherencia semanal: ' +
          registrosStore.adherenciaSemanalCalculada() +
          ' % · Cada comida registrada suma a tu bienestar'
        "
        variante="good"
      />

      <!-- Plan del día en máximo 5 tarjetas -->
      <section class="hoy-page__plan" aria-labelledby="titulo-comidas-hoy">
        <div class="hoy-page__plan-header">
          <h2 id="titulo-comidas-hoy" class="hoy-page__seccion-titulo">
            Tu plan del día ({{ registrosStore.tarjetasPlanHoy().length }} comidas)
          </h2>
          @if (registrosStore.cantidadEnCola() > 0) {
            <span class="hoy-page__cola-badge nr-tabular-nums">
              {{ registrosStore.cantidadEnCola() }} en cola offline
            </span>
          }
        </div>

        <div class="hoy-page__lista-comidas">
          @for (item of registrosStore.tarjetasPlanHoy(); track item.comida.tipo) {
            <app-tarjeta-comida-dia
              [item]="item"
              (seleccionar)="irARegistrarComida($event)"
            />
          }
        </div>
      </section>

      <!-- Botón principal "Registrar hoy" de ancho completo y 56 px de alto en la zona del pulgar -->
      <div class="hoy-page__zona-pulgar">
        <button
          type="button"
          class="btn-registrar-hoy"
          (click)="irARegistrarComida(registrosStore.proximaComidaPorRegistrar())"
        >
          Registrar hoy ({{ etiquetaProximaComida() }})
        </button>
      </div>
    </main>
  `,
  styles: `
    .hoy-page {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .hoy-page__header {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .hoy-page__fecha {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .hoy-page__saludo {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
    }

    .hoy-page__sub {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .hoy-page__plan {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .hoy-page__plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--nr-space-2);
    }

    .hoy-page__seccion-titulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .hoy-page__cola-badge {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
    }

    .hoy-page__lista-comidas {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-2);
    }

    .hoy-page__zona-pulgar {
      position: sticky;
      bottom: 68px;
      padding-top: var(--nr-space-2);
    }

    /* Una sola acción con color primario por pantalla: 100% ancho y 56 px alto */
    .btn-registrar-hoy {
      width: 100%;
      min-height: var(--nr-button-cta-height);
      height: 56px;
      padding: 0 var(--nr-space-6);
      border: none;
      border-radius: var(--nr-radius-button);
      background-color: var(--nr-color-action-primary);
      color: var(--nr-text-inverse);
      font-size: var(--nr-font-size-base);
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 110, 92, 0.22);
    }

    .btn-registrar-hoy:hover {
      background-color: var(--nr-color-action-primary-hover);
    }
  `,
})
export class HoyPageComponent {
  readonly sessionStore = inject(SessionStore);
  readonly registrosStore = inject(RegistrosStore);
  readonly #router = inject(Router);

  etiquetaProximaComida(): string {
    const tipo = this.registrosStore.proximaComidaPorRegistrar();
    const tarjeta = this.registrosStore
      .tarjetasPlanHoy()
      .find((t) => t.comida.tipo === tipo);
    return tarjeta ? tarjeta.comida.nombre.toLowerCase() : 'almuerzo';
  }

  irARegistrarComida(tipo: TipoComida): void {
    void this.#router.navigate(['/paciente/registrar', tipo]);
  }
}

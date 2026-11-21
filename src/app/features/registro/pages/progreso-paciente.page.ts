import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TarjetaIndicadorComponent } from '../../../shared/ui/tarjeta-indicador/tarjeta-indicador.component';
import { PanelEvolucionComponent } from '../../evolucion/components/panel-evolucion.component';
import { EvolucionStore } from '../../evolucion/evolucion.store';

/**
 * Pantalla «Progreso» del paciente:
 * Muestra gráficas accesibles de adherencia semanal y de peso (8 semanas) con resumen en texto y tabla alternativa.
 */
@Component({
  selector: 'app-progreso-paciente-page',
  standalone: true,
  imports: [TarjetaIndicadorComponent, PanelEvolucionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="progreso-page" aria-labelledby="titulo-progreso-paciente">
      <header class="progreso-page__header">
        <h1 id="titulo-progreso-paciente" class="progreso-page__titulo">
          Tu progreso (8 semanas)
        </h1>
        <p class="progreso-page__sub">
          Visualiza la evolución de tu peso y tu constancia semanal sin juicios.
        </p>
      </header>

      <div class="progreso-page__kpis">
        <app-tarjeta-indicador
          etiqueta="Cambio de peso"
          [valor]="evolucionStore.resumenCambioPeso().diferenciaKg + ' kg'"
          [detalle]="evolucionStore.resumenCambioPeso().textoResumen"
          variante="neutral"
        />

        <app-tarjeta-indicador
          etiqueta="Adherencia actual"
          [valor]="evolucionStore.adherenciaActualPorcentaje() + ' %'"
          [detalle]="evolucionStore.resumenAdherenciaTexto()"
          variante="good"
        />
      </div>

      <app-panel-evolucion
        [puntosPeso]="evolucionStore.puntosPeso()"
        [resumenPeso]="evolucionStore.resumenCambioPeso().textoResumen"
        [puntosAdherencia]="evolucionStore.puntosAdherencia()"
        [resumenAdherencia]="evolucionStore.resumenAdherenciaTexto()"
        [mostrarAdherencia]="true"
      />
    </main>
  `,
  styles: `
    .progreso-page {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .progreso-page__header {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .progreso-page__titulo {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
    }

    .progreso-page__sub {
      margin: 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .progreso-page__kpis {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--nr-space-2);
    }
  `,
})
export class ProgresoPacientePageComponent {
  readonly evolucionStore = inject(EvolucionStore);
}

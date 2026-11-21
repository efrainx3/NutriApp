import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  GraficaEvolucionComponent,
  PuntoEvolucion,
} from '../../../shared/ui/grafica-evolucion/grafica-evolucion.component';

/**
 * Componente presentacional compartido de evolución (gráfica de peso y gráfica de adherencia
 * con formas de marcador distintas: círculo para peso y cuadrado para adherencia).
 */
@Component({
  selector: 'app-panel-evolucion',
  standalone: true,
  imports: [GraficaEvolucionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-evolucion">
      <app-grafica-evolucion
        idUnico="peso-8-sem"
        titulo="Evolución del peso (8 semanas)"
        [resumenTexto]="resumenPeso()"
        unidad="kg"
        [puntos]="puntosPeso()"
        formaMarcador="circulo"
        varianteColor="neutral"
      />

      @if (mostrarAdherencia()) {
        <app-grafica-evolucion
          idUnico="adherencia-8-sem"
          titulo="Adherencia semanal al plan (%)"
          [resumenTexto]="resumenAdherencia()"
          unidad="%"
          [puntos]="puntosAdherencia()"
          formaMarcador="cuadrado"
          varianteColor="good"
        />
      }
    </div>
  `,
  styles: `
    .panel-evolucion {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }
  `,
})
export class PanelEvolucionComponent {
  readonly puntosPeso = input.required<readonly PuntoEvolucion[]>();
  readonly resumenPeso = input.required<string>();
  readonly puntosAdherencia = input<readonly PuntoEvolucion[]>([]);
  readonly resumenAdherencia = input<string>('');
  readonly mostrarAdherencia = input<boolean>(true);
}

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface PuntoEvolucion {
  readonly etiqueta: string; // Ej: 'Sem 1'
  readonly valor: number;
  readonly detalle?: string;
}

export type FormaMarcador = 'circulo' | 'cuadrado' | 'rombo';

/**
 * Gráfica accesible en SVG propio con:
 * - Marcadores diferenciados por forma geométrica además del color (WCAG 2.2 AA).
 * - Resumen descriptivo en texto.
 * - Tabla de datos alternativa accesible para lectores de pantalla y usuarios de teclado.
 */
@Component({
  selector: 'app-grafica-evolucion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grafica-card" [attr.aria-labelledby]="idTitulo()">
      <header class="grafica-card__header">
        <div>
          <h3 [id]="idTitulo()" class="grafica-card__titulo">{{ titulo() }}</h3>
          <p class="grafica-card__resumen" [id]="idResumen()">{{ resumenTexto() }}</p>
        </div>

        <button
          type="button"
          class="grafica-card__toggle"
          (click)="mostrarTabla.set(!mostrarTabla())"
          [attr.aria-expanded]="mostrarTabla()"
        >
          {{ mostrarTabla() ? 'Ocultar tabla de datos' : 'Ver tabla alternativa' }}
        </button>
      </header>

      @if (puntos().length > 0) {
        <div class="grafica-card__svg-wrapper">
          <svg
            class="grafica-card__svg"
            viewBox="0 0 560 220"
            role="img"
            [attr.aria-labelledby]="idTitulo() + ' ' + idResumen()"
          >
            <title>{{ titulo() }} — {{ resumenTexto() }}</title>
            <desc>{{ resumenTexto() }}</desc>

            <!-- Líneas guía horizontales -->
            @for (guia of lineasGuia(); track guia.y) {
              <line
                x1="48"
                [attr.y1]="guia.y"
                x2="536"
                [attr.y2]="guia.y"
                class="grafica-card__grid-line"
              />
              <text
                x="40"
                [attr.y]="guia.y + 4"
                text-anchor="end"
                class="grafica-card__axis-text nr-tabular-nums"
              >
                {{ guia.etiqueta }}
              </text>
            }

            <!-- Línea de tendencia -->
            @if (rutaPolilinea()) {
              <polyline
                [attr.points]="rutaPolilinea()"
                fill="none"
                [attr.stroke]="colorTrazo()"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            }

            <!-- Marcadores distinguibles por forma geométrica además del color -->
            @for (coord of coordenadas(); track coord.etiqueta) {
              <g class="grafica-card__punto">
                @switch (formaMarcador()) {
                  @case ('cuadrado') {
                    <rect
                      [attr.x]="coord.x - 6"
                      [attr.y]="coord.y - 6"
                      width="12"
                      height="12"
                      [attr.fill]="colorTrazo()"
                      stroke="#FFFFFF"
                      stroke-width="2"
                    />
                  }
                  @case ('rombo') {
                    <polygon
                      [attr.points]="
                        coord.x +
                        ',' +
                        (coord.y - 7) +
                        ' ' +
                        (coord.x + 7) +
                        ',' +
                        coord.y +
                        ' ' +
                        coord.x +
                        ',' +
                        (coord.y + 7) +
                        ' ' +
                        (coord.x - 7) +
                        ',' +
                        coord.y
                      "
                      [attr.fill]="colorTrazo()"
                      stroke="#FFFFFF"
                      stroke-width="2"
                    />
                  }
                  @default {
                    <circle
                      [attr.cx]="coord.x"
                      [attr.cy]="coord.y"
                      r="6"
                      [attr.fill]="colorTrazo()"
                      stroke="#FFFFFF"
                      stroke-width="2"
                    />
                  }
                }

                <!-- Valor numérico sobre el marcador -->
                <text
                  [attr.x]="coord.x"
                  [attr.y]="coord.y - 12"
                  text-anchor="middle"
                  class="grafica-card__value-text nr-tabular-nums"
                >
                  {{ coord.valorFormateado }}
                </text>

                <!-- Etiqueta eje X -->
                <text
                  [attr.x]="coord.x"
                  y="204"
                  text-anchor="middle"
                  class="grafica-card__axis-text"
                >
                  {{ coord.etiqueta }}
                </text>
              </g>
            }
          </svg>
        </div>

        <!-- Tabla alternativa accesible (visible al activar el botón o disponible en el DOM) -->
        <div [class.nr-sr-only]="!mostrarTabla()" class="grafica-card__tabla-contenedor">
          <table class="grafica-card__tabla">
            <caption>
              Tabla de datos:
              {{
                titulo()
              }}
              ({{
                unidad()
              }})
            </caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">Valor ({{ unidad() }})</th>
              </tr>
            </thead>
            <tbody>
              @for (p of puntos(); track p.etiqueta) {
                <tr>
                  <td>{{ p.etiqueta }}</td>
                  <td class="nr-tabular-nums">{{ p.valor }} {{ unidad() }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="grafica-card__vacio">No hay mediciones disponibles para graficar.</p>
      }
    </section>
  `,
  styles: `
    .grafica-card {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .grafica-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--nr-space-2);
    }

    .grafica-card__titulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .grafica-card__resumen {
      margin: var(--nr-space-1) 0 0;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-secondary);
      font-weight: 600;
    }

    .grafica-card__toggle {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      border: 1px solid var(--nr-border);
      border-radius: var(--nr-radius-button);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      cursor: pointer;
    }

    .grafica-card__svg-wrapper {
      width: 100%;
      overflow-x: auto;
    }

    .grafica-card__svg {
      width: 100%;
      height: auto;
      min-width: 310px;
      display: block;
    }

    .grafica-card__grid-line {
      stroke: var(--nr-border-subtle);
      stroke-dasharray: 4 4;
      stroke-width: 1;
    }

    .grafica-card__axis-text {
      font-size: 12px;
      fill: var(--nr-text-secondary);
      font-family: var(--nr-font-sans);
    }

    .grafica-card__value-text {
      font-size: 12px;
      font-weight: 700;
      fill: var(--nr-text-primary);
      font-family: var(--nr-font-sans);
    }

    .grafica-card__tabla-contenedor {
      overflow-x: auto;
    }

    .grafica-card__tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--nr-font-size-sm);
    }

    .grafica-card__tabla caption {
      text-align: left;
      font-weight: 600;
      margin-bottom: var(--nr-space-2);
      color: var(--nr-text-secondary);
    }

    .grafica-card__tabla th,
    .grafica-card__tabla td {
      border: 1px solid var(--nr-border-subtle);
      padding: var(--nr-space-2) var(--nr-space-4);
      text-align: left;
    }

    .grafica-card__tabla th {
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
    }

    .grafica-card__vacio {
      margin: 0;
      color: var(--nr-text-secondary);
    }
  `,
})
export class GraficaEvolucionComponent {
  readonly idUnico = input<string>('evolucion');
  readonly titulo = input.required<string>();
  readonly resumenTexto = input.required<string>();
  readonly unidad = input<string>('kg');
  readonly puntos = input.required<readonly PuntoEvolucion[]>();
  readonly formaMarcador = input<FormaMarcador>('circulo');
  readonly varianteColor = input<'neutral' | 'good'>('neutral');

  /** Estado efímero de UI (mostrar u ocultar visualmente la tabla alternativa) */
  readonly mostrarTabla = signal(false);

  readonly idTitulo = computed(() => `grafica-titulo-${this.idUnico()}`);
  readonly idResumen = computed(() => `grafica-resumen-${this.idUnico()}`);

  readonly colorTrazo = computed(() =>
    this.varianteColor() === 'good'
      ? 'var(--nr-color-adherence-good)'
      : 'var(--nr-color-data-neutral)'
  );

  readonly rangoValores = computed(() => {
    const lista = this.puntos();
    if (lista.length === 0) {
      return { min: 0, max: 100 };
    }
    const valores = lista.map((p) => p.valor);
    const minReal = Math.min(...valores);
    const maxReal = Math.max(...valores);
    const margen = maxReal === minReal ? 5 : (maxReal - minReal) * 0.25;
    return {
      min: Math.floor((minReal - margen) * 10) / 10,
      max: Math.ceil((maxReal + margen) * 10) / 10,
    };
  });

  readonly lineasGuia = computed(() => {
    const { min, max } = this.rangoValores();
    const medio = Math.round(((min + max) / 2) * 10) / 10;
    return [
      { y: 36, etiqueta: `${max}` },
      { y: 108, etiqueta: `${medio}` },
      { y: 180, etiqueta: `${min}` },
    ];
  });

  readonly coordenadas = computed(() => {
    const lista = this.puntos();
    if (lista.length === 0) return [];
    const { min, max } = this.rangoValores();
    const xInicio = 70;
    const xFin = 518;
    const ySuperior = 36;
    const yInferior = 180;
    const pasoX = lista.length > 1 ? (xFin - xInicio) / (lista.length - 1) : 0;
    const rangoY = max - min || 1;

    return lista.map((item, idx) => {
      const x = Math.round(xInicio + idx * pasoX);
      const proporcion = (item.valor - min) / rangoY;
      const y = Math.round(yInferior - proporcion * (yInferior - ySuperior));
      return {
        x,
        y,
        etiqueta: item.etiqueta,
        valor: item.valor,
        valorFormateado: `${item.valor}`.replace('.', ','),
      };
    });
  });

  readonly rutaPolilinea = computed(() =>
    this.coordenadas()
      .map((c) => `${c.x},${c.y}`)
      .join(' ')
  );
}

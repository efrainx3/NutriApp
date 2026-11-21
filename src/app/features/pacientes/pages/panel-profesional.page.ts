import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { TarjetaIndicadorComponent } from '../../../shared/ui/tarjeta-indicador/tarjeta-indicador.component';
import { PanelEvolucionComponent } from '../../evolucion/components/panel-evolucion.component';
import { EvolucionStore } from '../../evolucion/evolucion.store';
import { ListaPacientesComponent } from '../components/lista-pacientes.component';
import { TablaRegistrosPacienteComponent } from '../components/tabla-registros-paciente.component';
import { PacientesPageEvents } from '../pacientes.events';
import { PacientesStore } from '../pacientes.store';

export type PestanaFicha = 'resumen' | 'registros';

/**
 * Panel del nutricionista (escritorio, >= 1280 px):
 * - Lista de pacientes a la izquierda con buscador; ordenada primero por quienes bajaron su adherencia («Requiere atención»).
 * - Ficha del paciente a la derecha con pestañas Resumen, Valoración, Plan y Registros.
 *   - Resumen: cuatro tarjetas (IMC, cambio de peso, adherencia %, próximo control) y gráfica de evolución del peso con resumen en texto («Bajó 3,2 kg en 8 semanas»).
 *   - Registros: lista de los registros diarios del paciente; refleja lo que el paciente registró.
 *   - Valoración y Plan: cargadas como rutas hijas desacopladas (`<router-outlet />`) para cumplir la regla de cero imports cruzados entre features.
 * - Barra inferior fija con «Nueva valoración» y «Asignar plan».
 */
@Component({
  selector: 'app-panel-profesional-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ListaPacientesComponent,
    TarjetaIndicadorComponent,
    PanelEvolucionComponent,
    TablaRegistrosPacienteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-prof">
      <div class="panel-prof__grid">
        <!-- Columna izquierda: Lista de pacientes ordenada por prioridad de adherencia -->
        <app-lista-pacientes
          [pacientes]="pacientesStore.pacientesOrdenadosYFiltrados()"
          [seleccionadoId]="pacientesStore.pacienteSeleccionadoId()"
          [terminoBusqueda]="pacientesStore.terminoBusqueda()"
          (buscar)="alBuscar($event)"
          (seleccionarPaciente)="alSeleccionarPaciente($event)"
        />

        <!-- Columna derecha: Ficha clínica del paciente -->
        <main class="ficha-paciente" aria-labelledby="titulo-ficha-paciente">
          @if (pacientesStore.fichaActiva(); as ficha) {
            <header class="ficha-paciente__header">
              <div>
                <div class="ficha-paciente__titulo-fila">
                  <h1 id="titulo-ficha-paciente" class="ficha-paciente__nombre">
                    {{ ficha.paciente.nombre }} ({{ ficha.paciente.edad }} años)
                  </h1>
                  @if (ficha.paciente.adherenciaTendenciaBaja) {
                    <span class="ficha-paciente__alerta">Requiere atención</span>
                  }
                </div>
                <p class="ficha-paciente__diag">{{ ficha.paciente.diagnostico }}</p>
                <p class="ficha-paciente__plan-actual">
                  <strong>Plan asignado:</strong> {{ ficha.planActivo.nombre }} ({{ ficha.planActivo.kcalEstimadas }} kcal)
                </p>
              </div>
            </header>

            <!-- Pestañas de la ficha: Resumen, Valoración, Plan y Registros (100% operables con teclado) -->
            <nav class="ficha-tabs" aria-label="Secciones de la ficha clínica">
              <button
                type="button"
                class="ficha-tabs__tab"
                [class.ficha-tabs__tab--activa]="!enRutaHija() && pestanaLocal() === 'resumen'"
                (click)="activarPestanaLocal('resumen')"
              >
                Resumen clínico
              </button>

              <a
                routerLink="/profesional/valoracion"
                routerLinkActive="ficha-tabs__tab--activa"
                class="ficha-tabs__tab"
              >
                Valoración (5 secciones)
              </a>

              <a
                routerLink="/profesional/plan"
                routerLinkActive="ficha-tabs__tab--activa"
                class="ficha-tabs__tab"
              >
                Plan nutricional
              </a>

              <button
                type="button"
                class="ficha-tabs__tab"
                [class.ficha-tabs__tab--activa]="!enRutaHija() && pestanaLocal() === 'registros'"
                (click)="activarPestanaLocal('registros')"
              >
                Registros diarios ({{ pacientesStore.registrosPacienteActivo().length }})
              </button>
            </nav>

            <!-- Contenido de la pestaña activa -->
            @if (enRutaHija()) {
              <div class="ficha-paciente__subruta">
                <router-outlet />
              </div>
            } @else if (pestanaLocal() === 'resumen') {
              <section class="ficha-resumen" aria-label="Indicadores clave y evolución">
                <!-- Cuatro tarjetas: IMC, cambio de peso, adherencia %, próximo control -->
                <div class="ficha-resumen__kpis">
                  <app-tarjeta-indicador
                    etiqueta="IMC actual"
                    [valor]="
                      (evolucionStore.imcActual() ?? pacientesStore.imcFichaActiva() ?? '—') + ''
                    "
                    unidad="kg/m²"
                    [detalle]="evolucionStore.clasificacionImcActual() || pacientesStore.clasificacionImcFicha()"
                    variante="neutral"
                  />

                  <app-tarjeta-indicador
                    etiqueta="Cambio de peso"
                    [valor]="evolucionStore.resumenCambioPeso().diferenciaKg"
                    unidad="kg"
                    [detalle]="evolucionStore.resumenCambioPeso().textoResumen"
                    variante="neutral"
                  />

                  <app-tarjeta-indicador
                    etiqueta="Adherencia al plan"
                    [valor]="evolucionStore.adherenciaActualPorcentaje() || ficha.paciente.adherenciaActual"
                    unidad="%"
                    [detalle]="evolucionStore.resumenAdherenciaTexto()"
                    [variante]="ficha.paciente.adherenciaTendenciaBaja ? 'partial' : 'good'"
                  />

                  <app-tarjeta-indicador
                    etiqueta="Próximo control"
                    [valor]="ficha.paciente.proximoControl"
                    detalle="Cita de seguimiento programada"
                    variante="neutral"
                  />
                </div>

                <!-- Gráfica de evolución del peso con resumen en texto ("Bajó 3,2 kg en 8 semanas") -->
                <app-panel-evolucion
                  [puntosPeso]="evolucionStore.puntosPeso()"
                  [resumenPeso]="evolucionStore.resumenCambioPeso().textoResumen"
                  [puntosAdherencia]="evolucionStore.puntosAdherencia()"
                  [resumenAdherencia]="evolucionStore.resumenAdherenciaTexto()"
                  [mostrarAdherencia]="true"
                />
              </section>
            } @else {
              <app-tabla-registros-paciente
                [registros]="pacientesStore.registrosPacienteActivo()"
              />
            }
          } @else {
            <div class="ficha-paciente__cargando" role="status" aria-live="polite">
              Cargando ficha clínica del paciente…
            </div>
          }
        </main>
      </div>

      <!-- Barra inferior fija con "Nueva valoración" y "Asignar plan" -->
      <footer class="barra-inferior-prof" aria-label="Acciones clínicas rápidas">
        <div class="barra-inferior-prof__contenedor">
          <div class="barra-inferior-prof__info">
            @if (pacientesStore.fichaActiva(); as f) {
              <span>Paciente activo: <strong>{{ f.paciente.nombre }}</strong></span>
              <span class="nr-tabular-nums">
                Peso actual: {{ evolucionStore.pesoActualKg() ?? f.paciente.pesoActualKg }} kg · IMC: {{ evolucionStore.imcActual() ?? pacientesStore.imcFichaActiva() }} kg/m²
              </span>
            }
          </div>

          <div class="barra-inferior-prof__acciones">
            <a
              routerLink="/profesional/valoracion"
              class="btn-accion-fija btn-accion-fija--primaria"
            >
              + Nueva valoración
            </a>
            <a
              routerLink="/profesional/plan"
              class="btn-accion-fija btn-accion-fija--secundaria"
            >
              Asignar plan
            </a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: `
    .panel-prof {
      max-width: 1440px;
      margin: 0 auto;
      padding: var(--nr-space-6) var(--nr-space-6) 96px;
    }

    .panel-prof__grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: var(--nr-space-6);
      align-items: start;
    }

    @media (max-width: 1024px) {
      .panel-prof__grid {
        grid-template-columns: 1fr;
      }
    }

    .ficha-paciente {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .ficha-paciente__header {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-6);
    }

    .ficha-paciente__titulo-fila {
      display: flex;
      align-items: center;
      gap: var(--nr-space-4);
      flex-wrap: wrap;
    }

    .ficha-paciente__nombre {
      margin: 0;
      font-size: var(--nr-font-size-xl);
      color: var(--nr-text-primary);
    }

    .ficha-paciente__alerta {
      font-size: var(--nr-font-size-sm);
      font-weight: 700;
      padding: 2px var(--nr-space-2);
      border-radius: var(--nr-radius-card);
      background-color: var(--nr-color-adherence-partial-bg);
      color: var(--nr-color-adherence-partial);
      border: 1px solid var(--nr-color-adherence-partial);
    }

    .ficha-paciente__diag {
      margin: var(--nr-space-1) 0 0;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-secondary);
    }

    .ficha-paciente__plan-actual {
      margin: var(--nr-space-2) 0 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-color-action-primary);
    }

    .ficha-tabs {
      display: flex;
      gap: var(--nr-space-2);
      flex-wrap: wrap;
      border-bottom: 2px solid var(--nr-border-subtle);
      padding-bottom: var(--nr-space-2);
    }

    .ficha-tabs__tab {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-button);
      border: 1px solid var(--nr-border);
      background-color: var(--nr-surface-card);
      color: var(--nr-text-primary);
      font-size: var(--nr-font-size-sm);
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
    }

    .ficha-tabs__tab--activa {
      background-color: var(--nr-color-action-primary-subtle);
      color: var(--nr-color-action-primary);
      border: 2px solid var(--nr-color-action-primary);
    }

    .ficha-resumen {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .ficha-resumen__kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--nr-space-4);
    }

    @media (max-width: 1200px) {
      .ficha-resumen__kpis {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .ficha-paciente__cargando {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-8);
      text-align: center;
      color: var(--nr-text-secondary);
    }

    .barra-inferior-prof {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--nr-surface-card);
      border-top: 1px solid var(--nr-border);
      padding: var(--nr-space-2) var(--nr-space-6);
      z-index: 90;
    }

    .barra-inferior-prof__contenedor {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--nr-space-4);
    }

    .barra-inferior-prof__info {
      display: flex;
      gap: var(--nr-space-4);
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .barra-inferior-prof__acciones {
      display: flex;
      gap: var(--nr-space-2);
    }

    .btn-accion-fija {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-6);
      border-radius: var(--nr-radius-button);
      font-size: var(--nr-font-size-sm);
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-accion-fija--primaria {
      background-color: var(--nr-color-action-primary);
      color: var(--nr-text-inverse);
    }

    .btn-accion-fija--secundaria {
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      border: 1px solid var(--nr-border);
    }
  `,
})
export class PanelProfesionalPageComponent implements OnInit {
  readonly pacientesStore = inject(PacientesStore);
  readonly evolucionStore = inject(EvolucionStore);
  readonly #router = inject(Router);
  readonly #dispatchPacientes = injectDispatch(PacientesPageEvents);

  /** Estado efímero local de interfaz (pestaña activa cuando está en /profesional) */
  readonly pestanaLocal = signal<PestanaFicha>('resumen');
  readonly urlActual = signal<string>(this.#router.url);

  constructor() {
    this.#router.events.subscribe(() => {
      this.urlActual.set(this.#router.url);
    });
  }

  ngOnInit(): void {
    this.#dispatchPacientes.pacientesAbierta();
    this.#dispatchPacientes.fichaAbierta({
      pacienteId: this.pacientesStore.pacienteSeleccionadoId() || 'pac-jorge',
    });
  }

  enRutaHija(): boolean {
    const url = this.urlActual();
    return (
      url.includes('/profesional/valoracion') || url.includes('/profesional/plan')
    );
  }

  activarPestanaLocal(tab: PestanaFicha): void {
    this.pestanaLocal.set(tab);
    if (this.enRutaHija()) {
      void this.#router.navigate(['/profesional']);
    }
  }

  alBuscar(termino: string): void {
    this.#dispatchPacientes.busquedaCambiada({ termino });
  }

  alSeleccionarPaciente(pacienteId: string): void {
    this.#dispatchPacientes.fichaAbierta({ pacienteId });
  }
}

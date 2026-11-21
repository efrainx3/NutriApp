import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { EvolucionStore } from '../../evolucion/evolucion.store';
import { SelectorPlanComponent } from '../components/selector-plan.component';
import { PlanesPageEvents } from '../planes.events';
import { PlanesStore } from '../planes.store';

/**
 * Contenedor de la pestaña «Plan» en la ficha del nutricionista.
 * Lee señales de `PlanesStore` y `EvolucionStore` (compartido), y despacha `planAsignado`.
 * No importa nada de `features/pacientes` ni `features/valoracion`.
 */
@Component({
  selector: 'app-asignar-plan-page',
  standalone: true,
  imports: [SelectorPlanComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-selector-plan
      [plantillas]="planesStore.plantillas()"
      planActivoId="plan-glucemico"
      [guardando]="planesStore.guardando()"
      [mensajeExito]="planesStore.mensajeExito()"
      [mensajeError]="planesStore.mensajeError()"
      (confirmarPlan)="despacharAsignacionPlan($event)"
    />
  `,
})
export class AsignarPlanPageComponent implements OnInit {
  readonly planesStore = inject(PlanesStore);
  readonly evolucionStore = inject(EvolucionStore);
  readonly #dispatchPlanes = injectDispatch(PlanesPageEvents);

  ngOnInit(): void {
    this.#dispatchPlanes.plantillasSolicitadas();
  }

  despacharAsignacionPlan(plantillaId: string): void {
    this.#dispatchPlanes.planAsignado({
      pacienteId: this.evolucionStore.pacienteId(),
      plantillaId,
    });
  }
}

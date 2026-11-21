import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { EvolucionStore } from '../../evolucion/evolucion.store';
import { PayloadValoracionEnviada, ValoracionPageEvents } from '../valoracion.events';
import { ValoracionStore } from '../valoracion.store';
import { FormularioValoracionComponent } from '../components/formulario-valoracion.component';

/**
 * Contenedor de la pestaña «Valoración» en la ficha del nutricionista.
 * Lee señales de `EvolucionStore` (compartido) y `ValoracionStore`, y despacha `valoracionEnviada`.
 * No importa nada de `features/pacientes` ni `features/planes`.
 */
@Component({
  selector: 'app-valoracion-page',
  standalone: true,
  imports: [FormularioValoracionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-formulario-valoracion
      [pacienteId]="evolucionStore.pacienteId()"
      [nombrePaciente]="nombreAmigablePaciente()"
      [pesoInicial]="evolucionStore.pesoActualKg() ?? 84.2"
      [tallaInicial]="evolucionStore.tallaCm()"
      [guardando]="valoracionStore.guardando()"
      [mensajeExito]="valoracionStore.mensajeExito()"
      [mensajeError]="valoracionStore.mensajeError()"
      (enviarValoracion)="despacharValoracion($event)"
    />
  `,
})
export class ValoracionPageComponent implements OnInit {
  readonly evolucionStore = inject(EvolucionStore);
  readonly valoracionStore = inject(ValoracionStore);
  readonly #dispatchValoracion = injectDispatch(ValoracionPageEvents);

  ngOnInit(): void {
    this.#dispatchValoracion.estadoValoracionLimpiado();
  }

  nombreAmigablePaciente(): string {
    const id = this.evolucionStore.pacienteId();
    if (id === 'pac-jorge') return 'Jorge R.';
    return `Paciente (${id})`;
  }

  despacharValoracion(payload: PayloadValoracionEnviada): void {
    this.#dispatchValoracion.valoracionEnviada(payload);
  }
}

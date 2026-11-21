import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FECHA_HOY_SEMILLA } from '../../../core/api/seed-data';
import {
  calcularImc,
  clasificarImc,
} from '../../../shared/util/calculos';
import { PayloadValoracionEnviada } from '../valoracion.events';

/**
 * Formulario reactivo tipado de Valoración Clínica en 5 secciones:
 * 1) Datos generales (con campo condicional «semanas de gestación»).
 * 2) Antropometría (validaciones de peso 20–300 kg y talla 100–230 cm + IMC calculado al instante con computed()).
 * 3) Laboratorios.
 * 4) Hábitos.
 * 5) Objetivos.
 *
 * La valoración en edición vive únicamente en el formulario; solo emite `enviarValoracion`
 * cuando el formulario es válido. Incluye confirmación para la acción destructiva «Limpiar formulario».
 */
@Component({
  selector: 'app-formulario-valoracion',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="val-form-wrapper" aria-labelledby="titulo-form-valoracion">
      <header class="val-form__header">
        <div>
          <h3 id="titulo-form-valoracion" class="val-form__titulo">
            Valoración clínica nutricional — {{ nombrePaciente() }}
          </h3>
          <p class="val-form__sub">
            Completa las 5 secciones clínicas. Guardado pesimista: los cambios se aplican tras la confirmación del servidor.
          </p>
        </div>

        <div class="val-form__progreso" aria-label="Progreso de secciones completadas">
          <span class="val-form__progreso-texto nr-tabular-nums">
            Progreso: {{ seccionesValidasCount() }} de 5 secciones listas ({{ porcentajeProgreso() }} %)
          </span>
          <div class="val-form__barra-bg" role="progressbar" [attr.aria-valuenow]="porcentajeProgreso()" aria-valuemin="0" aria-valuemax="100">
            <div class="val-form__barra-fill" [style.width.%]="porcentajeProgreso()"></div>
          </div>
        </div>
      </header>

      @if (mensajeExito()) {
        <div class="val-form__banner val-form__banner--exito" role="status" aria-live="polite">
          {{ mensajeExito() }}
        </div>
      }

      @if (mensajeError()) {
        <div class="val-form__banner val-form__banner--error" role="alert">
          {{ mensajeError() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="alEnviar()" novalidate class="val-form">
        <!-- SECCIÓN 1: DATOS GENERALES -->
        <fieldset class="val-fieldset" formGroupName="datosGenerales">
          <legend class="val-legend">1. Datos generales y contexto</legend>

          <div class="val-grid">
            <div class="val-campo val-campo--full">
              <label for="val-motivo" class="val-label">Motivo de consulta *</label>
              <input
                id="val-motivo"
                type="text"
                class="val-input"
                formControlName="motivoConsulta"
                aria-describedby="err-val-motivo"
              />
              @if (
                form.controls.datosGenerales.controls.motivoConsulta.invalid &&
                form.controls.datosGenerales.controls.motivoConsulta.touched
              ) {
                <span id="err-val-motivo" class="val-error">
                  Ingresa el motivo de la consulta (mínimo 5 caracteres).
                </span>
              }
            </div>

            <div class="val-campo">
              <label class="val-checkbox-label" for="val-gestante">
                <input
                  id="val-gestante"
                  type="checkbox"
                  formControlName="gestante"
                  (change)="alCambiarGestante()"
                />
                <span>Paciente en estado de gestación</span>
              </label>
            </div>

            @if (esGestanteSignal()) {
              <div class="val-campo">
                <label for="val-semanas-gestacion" class="val-label">
                  Semanas de gestación (1–42) *
                </label>
                <input
                  id="val-semanas-gestacion"
                  type="number"
                  class="val-input nr-tabular-nums"
                  formControlName="semanasGestacion"
                  min="1"
                  max="42"
                  aria-describedby="err-val-semanas"
                />
                @if (
                  form.controls.datosGenerales.controls.semanasGestacion.invalid &&
                  form.controls.datosGenerales.controls.semanasGestacion.touched
                ) {
                  <span id="err-val-semanas" class="val-error">
                    Indica las semanas de gestación entre 1 y 42.
                  </span>
                }
              </div>
            }
          </div>
        </fieldset>

        <!-- SECCIÓN 2: ANTROPOMETRÍA + IMC AL INSTANTE CON COMPUTED() -->
        <fieldset class="val-fieldset" formGroupName="antropometria">
          <legend class="val-legend">2. Antropometría e IMC en tiempo real</legend>

          <div class="val-grid">
            <div class="val-campo">
              <label for="val-peso" class="val-label">Peso actual (kg, rango 20–300) *</label>
              <input
                id="val-peso"
                type="number"
                step="0.1"
                class="val-input nr-tabular-nums"
                formControlName="pesoKg"
                (input)="sincronizarSenalesAntropometria()"
                aria-describedby="err-val-peso"
              />
              @if (
                form.controls.antropometria.controls.pesoKg.invalid
              ) {
                <span id="err-val-peso" class="val-error">
                  El peso debe estar entre 20 y 300 kg.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-talla" class="val-label">Talla (cm, rango 100–230) *</label>
              <input
                id="val-talla"
                type="number"
                step="1"
                class="val-input nr-tabular-nums"
                formControlName="tallaCm"
                (input)="sincronizarSenalesAntropometria()"
                aria-describedby="err-val-talla"
              />
              @if (
                form.controls.antropometria.controls.tallaCm.invalid
              ) {
                <span id="err-val-talla" class="val-error">
                  La talla debe estar entre 100 y 230 cm.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-cintura" class="val-label">Circunferencia de cintura (cm) *</label>
              <input
                id="val-cintura"
                type="number"
                class="val-input nr-tabular-nums"
                formControlName="circunferenciaCinturaCm"
                aria-describedby="err-val-cintura"
              />
              @if (
                form.controls.antropometria.controls.circunferenciaCinturaCm.invalid &&
                form.controls.antropometria.controls.circunferenciaCinturaCm.touched
              ) {
                <span id="err-val-cintura" class="val-error">
                  Ingresa un perímetro válido entre 40 y 220 cm.
                </span>
              }
            </div>

            <!-- Tarjeta de IMC calculado al instante con computed() -->
            <div class="val-imc-instantaneo" aria-live="polite">
              <span class="val-imc-instantaneo__label">IMC calculado al instante</span>
              <strong class="val-imc-instantaneo__valor nr-tabular-nums">
                {{ imcInstantaneo() !== null ? imcInstantaneo() + ' kg/m²' : 'Fuera de rango' }}
              </strong>
              <span class="val-imc-instantaneo__clasificacion">
                {{ clasificacionImcInstantaneo() }}
              </span>
            </div>
          </div>
        </fieldset>

        <!-- SECCIÓN 3: LABORATORIOS -->
        <fieldset class="val-fieldset" formGroupName="laboratorios">
          <legend class="val-legend">3. Laboratorios bioquímicos</legend>

          <div class="val-grid">
            <div class="val-campo">
              <label for="val-glucosa" class="val-label">Glucosa en ayunas (mg/dL) *</label>
              <input
                id="val-glucosa"
                type="number"
                class="val-input nr-tabular-nums"
                formControlName="glucosaAyunasMgDl"
                aria-describedby="err-val-glucosa"
              />
              @if (
                form.controls.laboratorios.controls.glucosaAyunasMgDl.invalid &&
                form.controls.laboratorios.controls.glucosaAyunasMgDl.touched
              ) {
                <span id="err-val-glucosa" class="val-error">
                  Ingresa un valor entre 40 y 500 mg/dL.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-hba1c" class="val-label">HbA1c (%) *</label>
              <input
                id="val-hba1c"
                type="number"
                step="0.1"
                class="val-input nr-tabular-nums"
                formControlName="hba1cPorcentaje"
                aria-describedby="err-val-hba1c"
              />
              @if (
                form.controls.laboratorios.controls.hba1cPorcentaje.invalid &&
                form.controls.laboratorios.controls.hba1cPorcentaje.touched
              ) {
                <span id="err-val-hba1c" class="val-error">
                  Ingresa un porcentaje entre 3,5 y 18,0 %.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-trigliceridos" class="val-label">Triglicéridos (mg/dL) *</label>
              <input
                id="val-trigliceridos"
                type="number"
                class="val-input nr-tabular-nums"
                formControlName="trigliceridosMgDl"
                aria-describedby="err-val-trig"
              />
              @if (
                form.controls.laboratorios.controls.trigliceridosMgDl.invalid &&
                form.controls.laboratorios.controls.trigliceridosMgDl.touched
              ) {
                <span id="err-val-trig" class="val-error">
                  Ingresa un valor entre 30 y 1500 mg/dL.
                </span>
              }
            </div>
          </div>
        </fieldset>

        <!-- SECCIÓN 4: HÁBITOS -->
        <fieldset class="val-fieldset" formGroupName="habitos">
          <legend class="val-legend">4. Hábitos de estilo de vida</legend>

          <div class="val-grid">
            <div class="val-campo">
              <label for="val-sueno" class="val-label">Horas de sueño/noche *</label>
              <input
                id="val-sueno"
                type="number"
                step="0.5"
                class="val-input nr-tabular-nums"
                formControlName="horasSueno"
                aria-describedby="err-val-sueno"
              />
              @if (
                form.controls.habitos.controls.horasSueno.invalid &&
                form.controls.habitos.controls.horasSueno.touched
              ) {
                <span id="err-val-sueno" class="val-error">
                  Ingresa entre 2 y 16 horas.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-actividad" class="val-label">Actividad física (min/semana) *</label>
              <input
                id="val-actividad"
                type="number"
                class="val-input nr-tabular-nums"
                formControlName="actividadFisicaMinSem"
                aria-describedby="err-val-act"
              />
              @if (
                form.controls.habitos.controls.actividadFisicaMinSem.invalid &&
                form.controls.habitos.controls.actividadFisicaMinSem.touched
              ) {
                <span id="err-val-act" class="val-error">
                  Ingresa un valor entre 0 y 2000 min/semana.
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-agua" class="val-label">Consumo de agua (litros/día) *</label>
              <input
                id="val-agua"
                type="number"
                step="0.1"
                class="val-input nr-tabular-nums"
                formControlName="consumoAguaLitros"
                aria-describedby="err-val-agua"
              />
              @if (
                form.controls.habitos.controls.consumoAguaLitros.invalid &&
                form.controls.habitos.controls.consumoAguaLitros.touched
              ) {
                <span id="err-val-agua" class="val-error">
                  Ingresa entre 0,5 y 8,0 litros.
                </span>
              }
            </div>
          </div>
        </fieldset>

        <!-- SECCIÓN 5: OBJETIVOS -->
        <fieldset class="val-fieldset" formGroupName="objetivos">
          <legend class="val-legend">5. Objetivos terapéuticos y próximo control</legend>

          <div class="val-grid">
            <div class="val-campo val-campo--full">
              <label for="val-meta" class="val-label">Meta acordada con el paciente *</label>
              <input
                id="val-meta"
                type="text"
                class="val-input"
                formControlName="metaPrincipal"
                aria-describedby="err-val-meta"
              />
              @if (
                form.controls.objetivos.controls.metaPrincipal.invalid &&
                form.controls.objetivos.controls.metaPrincipal.touched
              ) {
                <span id="err-val-meta" class="val-error">
                  Describe la meta terapéutica acordada (mínimo 5 caracteres).
                </span>
              }
            </div>

            <div class="val-campo">
              <label for="val-prox-control" class="val-label">Fecha de próximo control *</label>
              <input
                id="val-prox-control"
                type="date"
                class="val-input nr-tabular-nums"
                formControlName="proximoControlFecha"
                aria-describedby="err-val-fecha"
              />
              @if (
                form.controls.objetivos.controls.proximoControlFecha.invalid &&
                form.controls.objetivos.controls.proximoControlFecha.touched
              ) {
                <span id="err-val-fecha" class="val-error">
                  Selecciona la fecha del próximo control.
                </span>
              }
            </div>
          </div>
        </fieldset>

        <div class="val-form__acciones">
          <button
            type="submit"
            class="val-btn val-btn--primario"
            [disabled]="guardando() || form.invalid"
          >
            {{ guardando() ? 'Guardando…' : 'Confirmar y guardar valoración' }}
          </button>

          @if (!confirmandoDescarte()) {
            <button
              type="button"
              class="val-btn val-btn--secundario"
              [disabled]="guardando()"
              (click)="confirmandoDescarte.set(true)"
            >
              Restablecer valores
            </button>
          } @else {
            <div class="val-confirmacion-destructiva" role="alert">
              <span>¿Descartar cambios no guardados?</span>
              <button
                type="button"
                class="val-btn val-btn--peligro"
                (click)="restablecerFormulario()"
              >
                Sí, descartar
              </button>
              <button
                type="button"
                class="val-btn val-btn--secundario"
                (click)="confirmandoDescarte.set(false)"
              >
                Cancelar
              </button>
            </div>
          }
        </div>
      </form>
    </section>
  `,
  styles: `
    .val-form-wrapper {
      background-color: var(--nr-surface-card);
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .val-form__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--nr-space-4);
    }

    .val-form__titulo {
      margin: 0;
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .val-form__sub {
      margin: var(--nr-space-1) 0 0;
      font-size: var(--nr-font-size-sm);
      color: var(--nr-text-secondary);
    }

    .val-form__progreso {
      min-width: 240px;
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .val-form__progreso-texto {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .val-form__barra-bg {
      height: 8px;
      background-color: var(--nr-surface-subtle);
      border-radius: var(--nr-radius-pill);
      overflow: hidden;
    }

    .val-form__barra-fill {
      height: 100%;
      background-color: var(--nr-color-action-primary);
      transition: width 0.2s ease;
    }

    .val-form__banner {
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-card);
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
    }

    .val-form__banner--exito {
      background-color: var(--nr-color-adherence-good-bg);
      color: var(--nr-color-adherence-good);
      border: 1px solid var(--nr-color-adherence-good);
    }

    .val-form__banner--error {
      background-color: var(--nr-color-feedback-error-bg);
      color: var(--nr-color-feedback-error);
      border: 1px solid var(--nr-color-feedback-error);
    }

    .val-form {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-4);
    }

    .val-fieldset {
      border: 1px solid var(--nr-border-subtle);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-4);
      margin: 0;
    }

    .val-legend {
      font-weight: 700;
      font-size: var(--nr-font-size-base);
      color: var(--nr-text-primary);
      padding: 0 var(--nr-space-2);
    }

    .val-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--nr-space-4);
      margin-top: var(--nr-space-2);
    }

    .val-campo {
      display: flex;
      flex-direction: column;
      gap: var(--nr-space-1);
    }

    .val-campo--full {
      grid-column: 1 / -1;
    }

    .val-label {
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .val-input {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-4);
      border-radius: var(--nr-radius-card);
      border: 1px solid var(--nr-border);
      font-size: var(--nr-font-size-base);
      font-family: var(--nr-font-sans);
      color: var(--nr-text-primary);
    }

    .val-checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--nr-space-2);
      min-height: var(--nr-button-min-target);
      font-weight: 600;
      cursor: pointer;
    }

    .val-error {
      font-size: var(--nr-font-size-sm);
      color: var(--nr-color-feedback-error);
      font-weight: 600;
    }

    .val-imc-instantaneo {
      background-color: var(--nr-color-data-neutral-bg);
      border-left: 4px solid var(--nr-color-data-neutral);
      border-radius: var(--nr-radius-card);
      padding: var(--nr-space-2) var(--nr-space-4);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
    }

    .val-imc-instantaneo__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--nr-text-secondary);
    }

    .val-imc-instantaneo__valor {
      font-size: var(--nr-font-size-lg);
      color: var(--nr-text-primary);
    }

    .val-imc-instantaneo__clasificacion {
      font-size: 12px;
      color: var(--nr-text-secondary);
    }

    .val-form__acciones {
      display: flex;
      align-items: center;
      gap: var(--nr-space-4);
      flex-wrap: wrap;
    }

    .val-btn {
      min-height: var(--nr-button-min-target);
      padding: var(--nr-space-2) var(--nr-space-6);
      border-radius: var(--nr-radius-button);
      font-size: var(--nr-font-size-base);
      font-weight: 700;
      cursor: pointer;
    }

    .val-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .val-btn--primario {
      background-color: var(--nr-color-action-primary);
      color: var(--nr-text-inverse);
      border: none;
    }

    .val-btn--secundario {
      background-color: var(--nr-surface-background);
      color: var(--nr-text-primary);
      border: 1px solid var(--nr-border);
    }

    .val-btn--peligro {
      background-color: var(--nr-color-feedback-error);
      color: var(--nr-text-inverse);
      border: none;
    }

    .val-confirmacion-destructiva {
      display: flex;
      align-items: center;
      gap: var(--nr-space-2);
      flex-wrap: wrap;
      font-size: var(--nr-font-size-sm);
      font-weight: 600;
      color: var(--nr-color-feedback-error);
    }
  `,
})
export class FormularioValoracionComponent {
  readonly pacienteId = input.required<string>();
  readonly nombrePaciente = input.required<string>();
  readonly pesoInicial = input<number>(84.2);
  readonly tallaInicial = input<number>(172);
  readonly guardando = input<boolean>(false);
  readonly mensajeExito = input<string>('');
  readonly mensajeError = input<string>('');

  readonly enviarValoracion = output<PayloadValoracionEnviada>();

  /** Señales locales para el cálculo instantáneo de IMC con computed() */
  readonly pesoSignal = signal<number | null>(84.2);
  readonly tallaSignal = signal<number | null>(172);
  readonly esGestanteSignal = signal<boolean>(false);
  readonly confirmandoDescarte = signal<boolean>(false);
  readonly versionFormulario = signal<number>(0);

  readonly imcInstantaneo = computed(() =>
    calcularImc(this.pesoSignal(), this.tallaSignal())
  );

  readonly clasificacionImcInstantaneo = computed(() =>
    clasificarImc(this.imcInstantaneo())
  );

  readonly form = new FormGroup({
    datosGenerales: new FormGroup({
      motivoConsulta: new FormControl('Control metabólico y revisión de adherencia', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
      }),
      gestante: new FormControl(false, { nonNullable: true }),
      semanasGestacion: new FormControl<number | null>(null),
    }),
    antropometria: new FormGroup({
      pesoKg: new FormControl(84.2, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(20), Validators.max(300)],
      }),
      tallaCm: new FormControl(172, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(100), Validators.max(230)],
      }),
      circunferenciaCinturaCm: new FormControl(96, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(40), Validators.max(220)],
      }),
    }),
    laboratorios: new FormGroup({
      glucosaAyunasMgDl: new FormControl(104, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(40), Validators.max(500)],
      }),
      hba1cPorcentaje: new FormControl(5.9, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(3.5), Validators.max(18)],
      }),
      trigliceridosMgDl: new FormControl(152, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(30), Validators.max(1500)],
      }),
    }),
    habitos: new FormGroup({
      horasSueno: new FormControl(7, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(2), Validators.max(16)],
      }),
      actividadFisicaMinSem: new FormControl(150, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(2000)],
      }),
      consumoAguaLitros: new FormControl(2.0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.5), Validators.max(8)],
      }),
    }),
    objetivos: new FormGroup({
      metaPrincipal: new FormControl(
        'Sostener desayuno y cena completos; caminata 30 min 5 días/semana',
        {
          nonNullable: true,
          validators: [Validators.required, Validators.minLength(5)],
        }
      ),
      proximoControlFecha: new FormControl('2026-12-05', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
  });

  readonly seccionesValidasCount = computed(() => {
    this.versionFormulario();
    let total = 0;
    if (this.form.controls.datosGenerales.valid) total++;
    if (this.form.controls.antropometria.valid) total++;
    if (this.form.controls.laboratorios.valid) total++;
    if (this.form.controls.habitos.valid) total++;
    if (this.form.controls.objetivos.valid) total++;
    return total;
  });

  readonly porcentajeProgreso = computed(
    () => (this.seccionesValidasCount() / 5) * 100
  );

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.versionFormulario.update((v) => v + 1);
    });

    effect(() => {
      const p = this.pesoInicial();
      const t = this.tallaInicial();
      this.form.controls.antropometria.patchValue(
        { pesoKg: p, tallaCm: t },
        { emitEvent: false }
      );
      this.pesoSignal.set(p);
      this.tallaSignal.set(t);
    });
  }

  sincronizarSenalesAntropometria(): void {
    const rawPeso = this.form.controls.antropometria.controls.pesoKg.value;
    const rawTalla = this.form.controls.antropometria.controls.tallaCm.value;
    this.pesoSignal.set(Number(rawPeso));
    this.tallaSignal.set(Number(rawTalla));
    this.versionFormulario.update((v) => v + 1);
  }

  alCambiarGestante(): void {
    const gestante = this.form.controls.datosGenerales.controls.gestante.value;
    const ctrlSemanas =
      this.form.controls.datosGenerales.controls.semanasGestacion;
    this.esGestanteSignal.set(gestante);

    if (gestante) {
      ctrlSemanas.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(42),
      ]);
      if (ctrlSemanas.value === null) {
        ctrlSemanas.setValue(20);
      }
    } else {
      ctrlSemanas.clearValidators();
      ctrlSemanas.setValue(null);
    }
    ctrlSemanas.updateValueAndValidity();
    this.versionFormulario.update((v) => v + 1);
  }

  alEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.versionFormulario.update((v) => v + 1);
      return;
    }

    const raw = this.form.getRawValue();
    this.enviarValoracion.emit({
      pacienteId: this.pacienteId(),
      fecha: FECHA_HOY_SEMILLA,
      datosGenerales: {
        motivoConsulta: raw.datosGenerales.motivoConsulta,
        gestante: raw.datosGenerales.gestante,
        semanasGestacion: raw.datosGenerales.gestante
          ? raw.datosGenerales.semanasGestacion
          : null,
      },
      antropometria: {
        pesoKg: Number(raw.antropometria.pesoKg),
        tallaCm: Number(raw.antropometria.tallaCm),
        circunferenciaCinturaCm: Number(
          raw.antropometria.circunferenciaCinturaCm
        ),
      },
      laboratorios: {
        glucosaAyunasMgDl: Number(raw.laboratorios.glucosaAyunasMgDl),
        hba1cPorcentaje: Number(raw.laboratorios.hba1cPorcentaje),
        trigliceridosMgDl: Number(raw.laboratorios.trigliceridosMgDl),
      },
      habitos: {
        horasSueno: Number(raw.habitos.horasSueno),
        actividadFisicaMinSem: Number(raw.habitos.actividadFisicaMinSem),
        consumoAguaLitros: Number(raw.habitos.consumoAguaLitros),
      },
      objetivos: {
        metaPrincipal: raw.objetivos.metaPrincipal,
        proximoControlFecha: raw.objetivos.proximoControlFecha,
      },
    });
  }

  restablecerFormulario(): void {
    this.confirmandoDescarte.set(false);
    this.esGestanteSignal.set(false);
    this.form.controls.datosGenerales.controls.semanasGestacion.clearValidators();
    this.form.reset({
      datosGenerales: {
        motivoConsulta: 'Control metabólico y revisión de adherencia',
        gestante: false,
        semanasGestacion: null,
      },
      antropometria: {
        pesoKg: this.pesoInicial(),
        tallaCm: this.tallaInicial(),
        circunferenciaCinturaCm: 96,
      },
      laboratorios: {
        glucosaAyunasMgDl: 104,
        hba1cPorcentaje: 5.9,
        trigliceridosMgDl: 152,
      },
      habitos: {
        horasSueno: 7,
        actividadFisicaMinSem: 150,
        consumoAguaLitros: 2.0,
      },
      objetivos: {
        metaPrincipal:
          'Sostener desayuno y cena completos; caminata 30 min 5 días/semana',
        proximoControlFecha: '2026-12-05',
      },
    });
    this.pesoSignal.set(this.pesoInicial());
    this.tallaSignal.set(this.tallaInicial());
    this.versionFormulario.update((v) => v + 1);
  }
}

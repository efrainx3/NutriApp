/**
 * Funciones puras de cálculo clínico y de adherencia para NutriRuta.
 * Ningún store almacena estos valores precalculados; siempre se derivan con computed()
 * o invocando estas funciones puras.
 */

export type NivelCumplimiento = 'completo' | 'parcial' | 'no-seguido';

export interface RegistroComidaCalculo {
  readonly fecha: string; // YYYY-MM-DD
  readonly cumplimiento: NivelCumplimiento;
}

/**
 * Calcula el Índice de Masa Corporal (IMC = pesoKg / (tallaM ^ 2)) redondeado a 1 decimal.
 * Devuelve null si los parámetros están fuera del rango fisiológico válido
 * (peso: 20–300 kg, talla: 100–230 cm).
 */
export function calcularImc(pesoKg: number | null | undefined, tallaCm: number | null | undefined): number | null {
  if (
    pesoKg === null ||
    pesoKg === undefined ||
    tallaCm === null ||
    tallaCm === undefined ||
    Number.isNaN(pesoKg) ||
    Number.isNaN(tallaCm)
  ) {
    return null;
  }

  if (pesoKg < 20 || pesoKg > 300 || tallaCm < 100 || tallaCm > 230) {
    return null;
  }

  const tallaMetros = tallaCm / 100;
  const imc = pesoKg / (tallaMetros * tallaMetros);
  return Math.round(imc * 10) / 10;
}

/**
 * Clasificación descriptiva neutra (sin juicio) del IMC para contexto clínico.
 */
export function clasificarImc(imc: number | null): string {
  if (imc === null) {
    return 'Pendiente de datos válidos';
  }
  if (imc < 18.5) {
    return 'Rango bajo (< 18,5)';
  }
  if (imc < 25) {
    return 'Rango de referencia (18,5 – 24,9)';
  }
  if (imc < 30) {
    return 'Rango superior (25,0 – 29,9)';
  }
  return 'Rango clínico prioritario (≥ 30,0)';
}

/**
 * Calcula la diferencia de peso (actual - inicial) en kg, redondeada a 1 decimal,
 * y genera un resumen en texto neutro sin juicio de valor.
 */
export function calcularCambioPeso(pesosKg: readonly number[]): {
  diferenciaKg: number;
  textoResumen: string;
} {
  if (!pesosKg || pesosKg.length === 0) {
    return {
      diferenciaKg: 0,
      textoResumen: 'Sin mediciones registradas',
    };
  }

  if (pesosKg.length === 1) {
    return {
      diferenciaKg: 0,
      textoResumen: '1 medición registrada (sin variación)',
    };
  }

  const pesoInicial = pesosKg[0];
  const pesoActual = pesosKg[pesosKg.length - 1];
  const diferencia = Math.round((pesoActual - pesoInicial) * 10) / 10;
  const semanas = pesosKg.length;
  const valorAbsoluto = Math.abs(diferencia).toFixed(1).replace('.', ',');

  if (diferencia < 0) {
    return {
      diferenciaKg: diferencia,
      textoResumen: `Bajó ${valorAbsoluto} kg en ${semanas} semanas`,
    };
  }
  if (diferencia > 0) {
    return {
      diferenciaKg: diferencia,
      textoResumen: `Subió ${valorAbsoluto} kg en ${semanas} semanas`,
    };
  }
  return {
    diferenciaKg: 0,
    textoResumen: `Estable (0,0 kg) en ${semanas} semanas`,
  };
}

/**
 * Calcula el porcentaje de adherencia ponderando:
 * - 'completo' = 1.0
 * - 'parcial' = 0.5
 * - 'no-seguido' = 0.0
 * Devuelve un entero entre 0 y 100.
 */
export function calcularPorcentajeAdherencia(
  registros: readonly Pick<RegistroComidaCalculo, 'cumplimiento'>[]
): number {
  if (!registros || registros.length === 0) {
    return 0;
  }

  const puntajeTotal = registros.reduce((acc, reg) => {
    if (reg.cumplimiento === 'completo') return acc + 1;
    if (reg.cumplimiento === 'parcial') return acc + 0.5;
    return acc;
  }, 0);

  return Math.round((puntajeTotal / registros.length) * 100);
}

/**
 * Cuenta cuántos días únicos (de los últimos `totalDiasObjetivo`, por defecto 7)
 * tienen al menos un registro con cumplimiento 'completo' o 'parcial', y devuelve
 * un mensaje en lenguaje positivo sin culpa.
 */
export function calcularProgresoSemanalDias(
  registros: readonly RegistroComidaCalculo[],
  totalDiasObjetivo = 7
): {
  diasCumplidos: number;
  totalDias: number;
  mensajePositivo: string;
} {
  if (!registros || registros.length === 0 || totalDiasObjetivo <= 0) {
    return {
      diasCumplidos: 0,
      totalDias: Math.max(totalDiasObjetivo, 7),
      mensajePositivo: 'Aún no hay registros esta semana. ¡Empieza hoy con un toque!',
    };
  }

  const diasConAvance = new Set<string>();
  for (const reg of registros) {
    if (reg.cumplimiento === 'completo' || reg.cumplimiento === 'parcial') {
      diasConAvance.add(reg.fecha);
    }
  }

  const diasCumplidos = Math.min(diasConAvance.size, totalDiasObjetivo);
  return {
    diasCumplidos,
    totalDias: totalDiasObjetivo,
    mensajePositivo: `Cumpliste ${diasCumplidos} de ${totalDiasObjetivo} días`,
  };
}

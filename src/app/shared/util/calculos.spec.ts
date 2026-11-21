import { describe, expect, it } from 'vitest';
import {
  calcularCambioPeso,
  calcularImc,
  calcularPorcentajeAdherencia,
  calcularProgresoSemanalDias,
  clasificarImc,
} from './calculos';

describe('calculos.ts (funciones puras clínicas y de adherencia)', () => {
  describe('calcularImc y clasificarImc', () => {
    it('calcula el IMC redondeado a 1 decimal dentro de rangos fisiológicos válidos', () => {
      // 84.2 kg / (1.72 m ^ 2) = 28.461... -> 28.5
      expect(calcularImc(84.2, 172)).toBe(28.5);
      // 65 kg / (1.65 m ^ 2) = 23.875... -> 23.9
      expect(calcularImc(65, 165)).toBe(23.9);
    });

    it('acepta los límites exactos de peso (20–300 kg) y talla (100–230 cm)', () => {
      expect(calcularImc(20, 100)).toBe(20);
      expect(calcularImc(300, 230)).toBe(56.7);
    });

    it('devuelve null para valores fuera de rango, nulos o NaN', () => {
      expect(calcularImc(19.9, 170)).toBeNull();
      expect(calcularImc(300.1, 170)).toBeNull();
      expect(calcularImc(70, 99)).toBeNull();
      expect(calcularImc(70, 231)).toBeNull();
      expect(calcularImc(null, 170)).toBeNull();
      expect(calcularImc(70, undefined)).toBeNull();
      expect(calcularImc(Number.NaN, 170)).toBeNull();
    });

    it('clasifica el IMC con lenguaje descriptivo neutro y sin juicio', () => {
      expect(clasificarImc(null)).toBe('Pendiente de datos válidos');
      expect(clasificarImc(17.8)).toContain('Rango bajo');
      expect(clasificarImc(22.4)).toContain('Rango de referencia');
      expect(clasificarImc(28.5)).toContain('Rango superior');
      expect(clasificarImc(31.2)).toContain('Rango clínico prioritario');
    });
  });

  describe('calcularCambioPeso', () => {
    it('calcula descenso de peso y genera resumen en texto exacto («Bajó 3,2 kg en 8 semanas»)', () => {
      const serie = [87.4, 86.9, 86.3, 85.8, 85.3, 84.9, 84.5, 84.2];
      const res = calcularCambioPeso(serie);
      expect(res.diferenciaKg).toBe(-3.2);
      expect(res.textoResumen).toBe('Bajó 3,2 kg en 8 semanas');
    });

    it('calcula aumento de peso con resumen neutro', () => {
      const serie = [63.2, 63.8, 64.5, 65.4];
      const res = calcularCambioPeso(serie);
      expect(res.diferenciaKg).toBe(2.2);
      expect(res.textoResumen).toBe('Subió 2,2 kg en 4 semanas');
    });

    it('maneja serie sin variación, con 1 medición o vacía', () => {
      expect(calcularCambioPeso([70, 70]).textoResumen).toBe(
        'Estable (0,0 kg) en 2 semanas'
      );
      expect(calcularCambioPeso([70]).diferenciaKg).toBe(0);
      expect(calcularCambioPeso([]).textoResumen).toBe(
        'Sin mediciones registradas'
      );
    });
  });

  describe('calcularPorcentajeAdherencia y calcularProgresoSemanalDias', () => {
    it('pondera completo=1, parcial=0.5 y no-seguido=0', () => {
      expect(calcularPorcentajeAdherencia([])).toBe(0);
      expect(
        calcularPorcentajeAdherencia([
          { cumplimiento: 'completo' },
          { cumplimiento: 'parcial' },
          { cumplimiento: 'no-seguido' },
        ])
      ).toBe(50);
      expect(
        calcularPorcentajeAdherencia([
          { cumplimiento: 'completo' },
          { cumplimiento: 'completo' },
        ])
      ).toBe(100);
    });

    it('cuenta días únicos con avance y devuelve mensaje positivo («Cumpliste 5 de 7 días»)', () => {
      const registros = [
        { fecha: '2026-11-15', cumplimiento: 'completo' as const },
        { fecha: '2026-11-16', cumplimiento: 'no-seguido' as const },
        { fecha: '2026-11-17', cumplimiento: 'parcial' as const },
        { fecha: '2026-11-18', cumplimiento: 'completo' as const },
        { fecha: '2026-11-20', cumplimiento: 'completo' as const },
        { fecha: '2026-11-21', cumplimiento: 'completo' as const },
        { fecha: '2026-11-21', cumplimiento: 'parcial' as const }, // mismo día
      ];

      const progreso = calcularProgresoSemanalDias(registros, 7);
      expect(progreso.diasCumplidos).toBe(5);
      expect(progreso.mensajePositivo).toBe('Cumpliste 5 de 7 días');
    });

    it('maneja lista vacía de progreso semanal con mensaje motivador', () => {
      const vacio = calcularProgresoSemanalDias([], 7);
      expect(vacio.diasCumplidos).toBe(0);
      expect(vacio.mensajePositivo).toContain('Aún no hay registros');
    });
  });
});

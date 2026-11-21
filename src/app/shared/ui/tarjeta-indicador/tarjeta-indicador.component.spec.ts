import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TarjetaIndicadorComponent } from './tarjeta-indicador.component';

describe('TarjetaIndicadorComponent (presentacional puro)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaIndicadorComponent],
    }).compileComponents();
  });

  it('renderiza etiqueta, valor tabular, unidad, insignia y detalle con entradas fijas', async () => {
    const fixture = TestBed.createComponent(TarjetaIndicadorComponent);
    fixture.componentRef.setInput('etiqueta', 'IMC actual');
    fixture.componentRef.setInput('valor', '28,5');
    fixture.componentRef.setInput('unidad', 'kg/m²');
    fixture.componentRef.setInput('detalle', 'Rango superior (25,0 – 29,9)');
    fixture.componentRef.setInput('insignia', 'Control');
    fixture.componentRef.setInput('variante', 'neutral');

    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('.tarjeta-indicador__etiqueta')?.textContent?.trim()
    ).toBe('IMC actual');
    expect(
      el.querySelector('.tarjeta-indicador__valor')?.textContent?.trim()
    ).toBe('28,5');
    expect(
      el.querySelector('.tarjeta-indicador__unidad')?.textContent?.trim()
    ).toBe('kg/m²');
    expect(
      el.querySelector('.tarjeta-indicador__detalle')?.textContent?.trim()
    ).toBe('Rango superior (25,0 – 29,9)');
    expect(
      el.querySelector('.tarjeta-indicador__insignia')?.textContent?.trim()
    ).toBe('Control');
    expect(
      el.querySelector('.tarjeta-indicador')?.classList.contains(
        'tarjeta-indicador--neutral'
      )
    ).toBe(true);
  });
});

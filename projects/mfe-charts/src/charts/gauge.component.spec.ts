import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { boundProperty } from '../testing/bound-property';
import { GaugeComponent, GaugeProps } from './gauge.component';

/** The token fallbacks as Chromium reports them; no theme stylesheet loads in the test. */
const GREEN = 'rgb(47, 143, 91)';
const YELLOW = 'rgb(226, 177, 0)';
const AMBER = 'rgb(225, 115, 11)';
const AMBER_TINT = 'rgb(253, 240, 226)';
const SUB = 'rgb(227, 233, 238)';

async function renderGauge(props: GaugeProps) {
  const fixture = TestBed.createComponent(GaugeComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'gauge');
  await fixture.whenStable();
  return fixture;
}

function fillStroke(host: HTMLElement): string {
  return getComputedStyle(host.querySelector('path[stroke-dasharray]')!).stroke;
}

function badgeFill(host: HTMLElement): string {
  return getComputedStyle(host.querySelector('.cf-badge')!).backgroundColor;
}

describe('GaugeComponent', () => {
  it('T4-AC-01 renders value and max into the SVG and re-renders when value changes', async () => {
    const value = boundProperty(12);
    const fixture = await renderGauge({ value, max: boundProperty(100) });

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.textContent).toContain('12');
    expect(svg.textContent).toContain('100');

    value.value.set(50);
    await fixture.whenStable();

    expect(svg.textContent).toContain('50');
  });

  // A viewBox-only svg has no intrinsic size; without an explicit host width
  // the gauge collapses to 0x0 inside the renderer's flex rows — found by a
  // visual probe, invisible to the textContent assertions above.
  it('occupies real size inside a flex container', async () => {
    const fixture = await renderGauge({ value: boundProperty(12), max: boundProperty(100) });
    const host = fixture.nativeElement as HTMLElement;
    host.parentElement!.style.display = 'flex';

    const rect = host.querySelector('svg')!.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(50);
    expect(rect.height).toBeGreaterThan(30);
  });

  it('renders the optional label as the badge and fills the arc proportionally', async () => {
    const fixture = await renderGauge({
      value: boundProperty(25),
      max: boundProperty(100),
      label: boundProperty('Tickets left'),
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.cf-badge')?.textContent).toContain('Tickets left');
    expect(host.querySelector('svg')?.textContent).not.toContain('Tickets left');

    const filledArc = host.querySelector('path[stroke-dasharray]');
    const [filled] = (filledArc?.getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
    expect(filled).toBeCloseTo((Math.PI * 40) / 4, 0);
  });

  it('T8-AC-01 colours the fill green, yellow or amber by the share of the maximum', async () => {
    const value = boundProperty(80);
    const fixture = await renderGauge({ value, max: boundProperty(100) });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.dataset['level']).toBe('high');
    expect(fillStroke(host)).toBe(GREEN);

    value.value.set(50);
    await fixture.whenStable();
    expect(host.dataset['level']).toBe('mid');
    expect(fillStroke(host)).toBe(YELLOW);

    value.value.set(20);
    await fixture.whenStable();
    expect(host.dataset['level']).toBe('low');
    expect(fillStroke(host)).toBe(AMBER);
  });

  it('T8-AC-01 yellow starts at 30 % and includes 65 %', async () => {
    const value = boundProperty(29);
    const fixture = await renderGauge({ value, max: boundProperty(100) });
    const host = fixture.nativeElement as HTMLElement;
    const levelAt = async (v: number) => {
      value.value.set(v);
      await fixture.whenStable();
      return host.dataset['level'];
    };

    expect(host.dataset['level']).toBe('low');
    expect(await levelAt(30)).toBe('mid');
    expect(await levelAt(65)).toBe('mid');
    expect(await levelAt(66)).toBe('high');
  });

  it('T8-AC-02 the badge takes the attention style only below 30 %', async () => {
    const value = boundProperty(20);
    const fixture = await renderGauge({
      value,
      max: boundProperty(100),
      label: boundProperty('Tickets left'),
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(badgeFill(host)).toBe(AMBER_TINT);

    value.value.set(30);
    await fixture.whenStable();
    expect(badgeFill(host)).toBe(SUB);

    value.value.set(80);
    await fixture.whenStable();
    expect(badgeFill(host)).toBe(SUB);
  });

  it('T8-AC-03 states the percentage in English with one decimal at most', async () => {
    const value = boundProperty(12);
    const max = boundProperty(500);
    const fixture = await renderGauge({ value, max });
    const host = fixture.nativeElement as HTMLElement;
    const percent = () => host.querySelector('.cf-percent')?.textContent?.trim();

    expect(percent()).toBe('2.4 %');

    value.value.set(500);
    await fixture.whenStable();
    expect(percent()).toBe('100 %');

    max.value.set(3);
    value.value.set(1);
    await fixture.whenStable();
    expect(percent()).toBe('33.3 %');

    max.value.set(0);
    await fixture.whenStable();
    expect(percent()).toBe('0 %');
  });
});

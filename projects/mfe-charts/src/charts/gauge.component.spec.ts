import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { boundProperty } from '../testing/bound-property';
import { GaugeComponent, GaugeProps } from './gauge.component';

async function renderGauge(props: GaugeProps) {
  const fixture = TestBed.createComponent(GaugeComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'gauge');
  await fixture.whenStable();
  return fixture;
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

  it('renders the optional label and fills the arc proportionally', async () => {
    const fixture = await renderGauge({
      value: boundProperty(25),
      max: boundProperty(100),
      label: boundProperty('Tickets left'),
    });

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.textContent).toContain('Tickets left');

    const filledArc = svg.querySelector('path[stroke-dasharray]');
    const [filled] = (filledArc?.getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
    expect(filled).toBeCloseTo((Math.PI * 40) / 4, 0);
  });
});

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { describe, expect, it, vi } from 'vitest';
import { A2uiActionBus } from '../../a2ui/action-bus';
import { provideAgentCapabilities } from '../../a2ui/agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from '../../a2ui/assistant-catalog';
import { boundProperty } from '../../testing/bound-property';
import { mapsCapability } from '../maps';
import { chartsCapability } from './index';
import { TimelineComponent, TimelineItem, TimelineProps } from './timeline.component';

const ITEMS: TimelineItem[] = [
  { id: 'c', label: 'Third', date: '2026-11-20', remaining: 5, url: 'https://c.example' },
  { id: 'a', label: 'First', date: '2026-09-15', remaining: 12, url: 'https://a.example' },
  { id: 'b', label: 'Second', date: '2026-10-01', remaining: 9, url: 'https://b.example' },
];

async function renderTimeline(props: TimelineProps) {
  const fixture = TestBed.createComponent(TimelineComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'timeline');
  await fixture.whenStable();
  return fixture;
}

function markersOf(fixture: { nativeElement: HTMLElement }): SVGGElement[] {
  return [...fixture.nativeElement.querySelectorAll<SVGGElement>('g.cf-marker')];
}

function click(marker: SVGGElement): void {
  marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('TimelineComponent', () => {
  it('T5-AC-01 renders one marker per item ordered by date and writes the whole clicked item', async () => {
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(ITEMS), selected });

    const markers = markersOf(fixture);
    expect(markers).toHaveLength(3);
    const labels = markers.map((marker) => marker.querySelector('.cf-label')?.textContent?.trim());
    expect(labels).toEqual(['First', 'Second', 'Third']);

    click(markers[1]);

    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith({
      id: 'b',
      label: 'Second',
      date: '2026-10-01',
      remaining: 9,
      url: 'https://b.example',
    });
  });

  it('T5-AC-02 clicking without a bound selected is a no-op and does not throw', async () => {
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(ITEMS) });

    expect(() => click(markersOf(fixture)[0])).not.toThrow();
  });

  it('positions markers proportionally inside an explicit range', async () => {
    // Range spans 120 days from the first item; day 0 → axis start (x=40),
    // day 66 → 40 + (66/120) * 320 = 216.
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      range: boundProperty<{ from: string; to: string } | undefined>({
        from: '2026-09-15',
        to: '2027-01-13',
      }),
    });

    const xs = markersOf(fixture).map((marker) =>
      Number(marker.querySelector('circle')!.getAttribute('cx')),
    );
    expect(xs[0]).toBe(40);
    expect(xs[2]).toBe(216);
  });

  it('survives a degenerate range with equal bounds', async () => {
    const sameDay = ITEMS.map((item) => ({ ...item, date: '2026-09-15' }));
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(sameDay),
      range: boundProperty<{ from: string; to: string } | undefined>({
        from: '2026-09-15',
        to: '2026-09-15',
      }),
    });

    const xs = markersOf(fixture).map((marker) =>
      Number(marker.querySelector('circle')!.getAttribute('cx')),
    );
    expect(xs).toEqual([40, 40, 40]);
  });

  it('highlights the marker whose id matches the selected value', async () => {
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      selected: boundProperty<unknown>(ITEMS[2]),
    });

    const highlighted = [...fixture.nativeElement.querySelectorAll('g.cf-selected')];
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].querySelector('.cf-label')?.textContent).toContain('Second');
  });

  // A viewBox-only svg has no intrinsic size; without an explicit host width
  // the timeline collapses to 0x0 inside the renderer's flex rows.
  it('occupies real size inside a flex container', async () => {
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(ITEMS) });
    const host = fixture.nativeElement as HTMLElement;
    host.parentElement!.style.display = 'flex';

    const rect = host.querySelector('svg')!.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(100);
    expect(rect.height).toBeGreaterThan(20);
  });
});

const SURFACE_ID = 'timeline-action-surface';

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

function timelineSurfaceMessages(): A2uiMessage[] {
  return [
    {
      version: 'v0.9',
      createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          {
            id: 'root',
            component: 'Timeline',
            items: { path: '/filteredConfs' },
            action: { event: { name: 'pick', context: { id: { path: '/x/id' } } } },
          },
        ],
      },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: ITEMS } },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/x', value: { id: 'x-marks' } } },
  ];
}

describe('Timeline through the real renderer', () => {
  it('T5-AC-04 dispatches the pick action with the resolved context to the action bus', async () => {
    TestBed.configureTestingModule({
      providers: [provideAgentCapabilities([chartsCapability, mapsCapability])],
    });
    const seen: A2uiClientAction[] = [];
    TestBed.inject(A2uiActionBus).subscribe((action) => seen.push(action));
    TestBed.inject(A2uiRendererService).processMessages(timelineSurfaceMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();
    click(markersOf(fixture)[0]);

    await vi.waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toMatchObject({
      name: 'pick',
      surfaceId: SURFACE_ID,
      context: { id: 'x-marks' },
    });
  });

  it('T5-AC-02 a literal selected renders a no-op onUpdate: clicking neither throws nor writes', async () => {
    TestBed.configureTestingModule({
      providers: [provideAgentCapabilities([chartsCapability, mapsCapability])],
    });
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages([
      {
        version: 'v0.9',
        createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: SURFACE_ID,
          components: [
            { id: 'root', component: 'Timeline', items: { path: '/filteredConfs' }, selected: 'unbound' },
          ],
        },
      },
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: ITEMS } },
    ]);

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    expect(() => click(markersOf(fixture)[0])).not.toThrow();
    await fixture.whenStable();

    expect(renderer.surfaceGroup.getSurface(SURFACE_ID)?.dataModel.get('/')).toEqual({
      filteredConfs: ITEMS,
    });
  });
});

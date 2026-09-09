import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A2uiActionBus } from '../../a2ui/action-bus';
import { ASSISTANT_CATALOG_ID, createAssistantCatalog } from '../../a2ui/assistant-catalog';
import { provideA2uiCatalog } from '../../a2ui/provide-a2ui-catalog';
import { boundProperty } from '../../testing/bound-property';
import { chartsFragment } from '../charts';
import { mapsFragment } from './index';
import { MapCenter, MapComponent, MapPoint, MapProps } from './map.component';

const POINTS: MapPoint[] = [
  { id: 'berlin-conf', label: 'Berlin', lat: 52.52, lon: 13.405, remaining: 12, url: 'https://b.example' },
  { id: 'muc-conf', label: 'München', lat: 48.1372, lon: 11.5756, remaining: 5, url: 'https://m.example' },
  { id: 'hh-conf', label: 'Hamburg', lat: 53.5511, lon: 9.9937, remaining: 9, url: 'https://h.example' },
];

async function renderMap(props: MapProps) {
  const fixture = TestBed.createComponent(MapComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'map');
  await fixture.whenStable();
  return fixture;
}

function markersOf(fixture: { nativeElement: HTMLElement }): SVGGElement[] {
  return [...fixture.nativeElement.querySelectorAll<SVGGElement>('g.cf-marker')];
}

function click(marker: SVGGElement): void {
  marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('MapComponent', () => {
  it('T5-AC-03 renders point markers inside the viewport, a distinct center marker, and writes the whole clicked point', async () => {
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>(POINTS),
      center: boundProperty<MapCenter | undefined>({ lat: 52.52, lon: 13.405, city: 'Berlin' }),
      selected,
    });

    const markers = markersOf(fixture);
    expect(markers).toHaveLength(3);
    for (const marker of markers) {
      const dot = marker.querySelector('.cf-dot')!;
      const cx = Number(dot.getAttribute('cx'));
      const cy = Number(dot.getAttribute('cy'));
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cx).toBeLessThanOrEqual(400);
      expect(cy).toBeGreaterThanOrEqual(0);
      expect(cy).toBeLessThanOrEqual(260);
    }
    expect(fixture.nativeElement.querySelector('.cf-center-mark')).not.toBeNull();

    click(markers[1]);

    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith({
      id: 'muc-conf',
      label: 'München',
      lat: 48.1372,
      lon: 11.5756,
      remaining: 5,
      url: 'https://m.example',
    });
  });

  it('spreads coincident markers so each one is individually clickable', async () => {
    const twin = { id: 'ai-quarry', label: 'AI Quarry', lat: 52.52, lon: 13.405 };
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>([POINTS[0], twin, POINTS[2]]),
      selected,
    });

    const dots = markersOf(fixture).map((marker) => marker.querySelector('.cf-dot')!);
    expect(dots[0].getAttribute('cx')).not.toBe(dots[1].getAttribute('cx'));

    click(markersOf(fixture)[0]);
    click(markersOf(fixture)[1]);

    expect(selected.onUpdate).toHaveBeenNthCalledWith(1, POINTS[0]);
    expect(selected.onUpdate).toHaveBeenNthCalledWith(2, twin);
  });

  it('omits the center marker when center is not set and survives clicks without selected', async () => {
    const fixture = await renderMap({ points: boundProperty<readonly MapPoint[]>(POINTS) });

    expect(fixture.nativeElement.querySelector('.cf-center-mark')).toBeNull();
    expect(() => click(markersOf(fixture)[0])).not.toThrow();
  });

  // A viewBox-only svg has no intrinsic size; without an explicit host width
  // the map collapses to 0x0 inside the renderer's flex rows.
  it('occupies real size inside a flex container', async () => {
    const fixture = await renderMap({ points: boundProperty<readonly MapPoint[]>(POINTS) });
    const host = fixture.nativeElement as HTMLElement;
    host.parentElement!.style.display = 'flex';

    const rect = host.querySelector('svg')!.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(100);
    expect(rect.height).toBeGreaterThan(60);
  });
});

const SURFACE_ID = 'map-selection-surface';

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

function configureRenderer(): A2uiRendererService {
  TestBed.configureTestingModule({
    providers: [provideA2uiCatalog(createAssistantCatalog([chartsFragment, mapsFragment]))],
  });
  return TestBed.inject(A2uiRendererService);
}

function createSurfaceMessage(): A2uiMessage {
  return {
    version: 'v0.9',
    createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID },
  };
}

describe('Map through the real renderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T5-AC-04 dispatches the pick action with the resolved context to the action bus', async () => {
    const renderer = configureRenderer();
    const seen: A2uiClientAction[] = [];
    TestBed.inject(A2uiActionBus).subscribe((action) => seen.push(action));
    renderer.processMessages([
      createSurfaceMessage(),
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: SURFACE_ID,
          components: [
            {
              id: 'root',
              component: 'Map',
              points: { path: '/confs' },
              action: { event: { name: 'pick', context: { id: { path: '/x/id' } } } },
            },
          ],
        },
      },
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/confs', value: POINTS } },
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/x', value: { id: 'x-marks' } } },
    ]);

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

  it('T5-AC-05 clicking a marker writes the point to /conf and re-renders a Text bound to /conf/name without any fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const renderer = configureRenderer();
    renderer.processMessages([
      createSurfaceMessage(),
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: SURFACE_ID,
          components: [
            { id: 'root', component: 'Column', children: ['map', 'conf-name'] },
            {
              id: 'map',
              component: 'Map',
              points: { path: '/confs' },
              selected: { path: '/conf' },
            },
            { id: 'conf-name', component: 'Text', text: { path: '/conf/name' } },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: SURFACE_ID,
          path: '/confs',
          value: POINTS.map(({ label, ...point }) => ({ ...point, name: `${label} Days` })),
        },
      },
    ]);

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    // The map's own marker label also renders the name, so the assertion must
    // target the Text component's element, not the whole DOM.
    const textEl = () => (fixture.nativeElement as HTMLElement).querySelector('a2ui-v09-text');
    expect(textEl()?.textContent ?? '').not.toContain('München Days');

    click(markersOf(fixture)[1]);
    await fixture.whenStable();

    await vi.waitFor(() => expect(textEl()?.textContent).toContain('München Days'));
    const surface = renderer.surfaceGroup.getSurface(SURFACE_ID);
    expect(surface?.dataModel.get('/conf')).toMatchObject({ id: 'muc-conf', name: 'München Days' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

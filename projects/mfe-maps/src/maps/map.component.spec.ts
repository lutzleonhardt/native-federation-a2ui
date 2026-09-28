import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  A2uiRendererService,
  SurfaceComponent,
  provideA2Ui,
  provideMarkdownRenderer,
} from '@a2ui/angular/v0_9';
import { renderMarkdown } from '@a2ui/markdown-it';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import type { StyleSpecification } from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAPS_CATALOG_ID, createMapsCatalog } from '../app/maps-catalog';
import { boundProperty } from '../testing/bound-property';
import { OFFLINE_MAP, OFFLINE_STYLE, provideOfflineMap } from '../testing/offline-map';
import { MAP_RESOURCES } from './map-resources';
import { MapCenter, MapComponent, MapPoint, MapProps } from './map.component';

const POINTS: MapPoint[] = [
  {
    id: 'berlin-conf',
    label: 'Berlin',
    lat: 52.52,
    lon: 13.405,
    remaining: 12,
    url: 'https://b.example',
  },
  {
    id: 'muc-conf',
    label: 'Munich',
    lat: 48.1372,
    lon: 11.5756,
    remaining: 5,
    url: 'https://m.example',
  },
  {
    id: 'hh-conf',
    label: 'Hamburg',
    lat: 53.5511,
    lon: 9.9937,
    remaining: 9,
    url: 'https://h.example',
  },
];

/** The map builds its markers once the style is in place, a frame after creation. */
async function renderMap(props: MapProps) {
  const fixture = TestBed.createComponent(MapComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'map');
  await fixture.whenStable();
  const expected = props.points.value()?.length ?? 0;
  await vi.waitFor(() => expect(markersOf(fixture)).toHaveLength(expected));
  return fixture;
}

function markersOf(fixture: { nativeElement: HTMLElement }): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll<HTMLElement>('.cf-marker')];
}

function click(marker: HTMLElement): void {
  marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function isSelected(marker: HTMLElement): boolean {
  return marker.classList.contains('cf-selected');
}

describe('MapComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideOfflineMap()] }));
  afterEach(() => vi.restoreAllMocks());

  it('T2-AC-01 places one marker per point inside the map and a user marker labelled with the city; T2-AC-02 a click writes the whole point', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>(POINTS),
      center: boundProperty<MapCenter | undefined>({ lat: 52.52, lon: 13.405, city: 'Berlin' }),
      selected,
    });

    const markers = markersOf(fixture);
    expect(markers.map((marker) => marker.dataset['id'])).toEqual([
      'berlin-conf',
      'muc-conf',
      'hh-conf',
    ]);
    const canvas = fixture.nativeElement.querySelector('.cf-map-canvas')!.getBoundingClientRect();
    for (const marker of markers) {
      const rect = marker.getBoundingClientRect();
      expect(rect.left).toBeGreaterThanOrEqual(canvas.left);
      expect(rect.right).toBeLessThanOrEqual(canvas.right);
      expect(rect.top).toBeGreaterThanOrEqual(canvas.top);
      expect(rect.bottom).toBeLessThanOrEqual(canvas.bottom);
    }
    expect(fixture.nativeElement.querySelector('.cf-center')?.textContent).toContain('Berlin');

    click(markers[1]);

    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith({
      id: 'muc-conf',
      label: 'Munich',
      lat: 48.1372,
      lon: 11.5756,
      remaining: 5,
      url: 'https://m.example',
    });
    // T2-AC-06: no style, tile or glyph request leaves the page.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T2-AC-02 marks the selection with the ink ring, following the bound value', async () => {
    const selected = boundProperty<unknown>(POINTS[1]);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>(POINTS),
      selected,
    });

    expect(markersOf(fixture).map(isSelected)).toEqual([false, true, false]);

    selected.value.set(POINTS[2]);

    await vi.waitFor(() =>
      expect(markersOf(fixture).map(isSelected)).toEqual([false, false, true]),
    );
  });

  it('T2-AC-03 spreads coincident points so each dot stays individually clickable', async () => {
    const twin = { id: 'ai-quarry', label: 'AI Quarry', lat: 52.52, lon: 13.405 };
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>([POINTS[0], twin, POINTS[2]]),
      selected,
    });

    const [berlin, quarry] = markersOf(fixture);
    expect(berlin.style.transform).not.toBe(quarry.style.transform);

    click(berlin);
    click(quarry);

    expect(selected.onUpdate).toHaveBeenNthCalledWith(1, POINTS[0]);
    expect(selected.onUpdate).toHaveBeenNthCalledWith(2, twin);
  });

  it("T2-AC-02 keeps a conference at the user's location clickable: the dots share the spread and the location marker lets clicks through", async () => {
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>([POINTS[0]]),
      center: boundProperty<MapCenter | undefined>({
        lat: POINTS[0].lat,
        lon: POINTS[0].lon,
        city: 'Berlin',
      }),
      selected,
    });

    const [berlin] = markersOf(fixture);
    const center = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.cf-center')!;
    expect(berlin.style.transform).not.toBe(center.style.transform);
    expect(getComputedStyle(center).pointerEvents).toBe('none');
    const rect = berlin.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    expect(hit?.closest('.cf-marker')).toBe(berlin);

    click(berlin);

    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith(POINTS[0]);
  });

  it('T2-AC-02 brings a selection made elsewhere back into view and leaves the viewport alone otherwise', async () => {
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderMap({
      points: boundProperty<readonly MapPoint[]>(POINTS),
      selected,
    });
    // The viewport is MapLibre state, reachable only through the instance.
    const map = fixture.componentInstance['map']()!;
    const canvas = fixture.nativeElement.querySelector('.cf-map-canvas')!;
    const inView = (marker: HTMLElement): boolean => {
      const r = marker.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      return r.left >= c.left && r.right <= c.right && r.top >= c.top && r.bottom <= c.bottom;
    };

    map.jumpTo({ center: [-30, 45], zoom: 4 });
    expect(markersOf(fixture).map(inView)).toEqual([false, false, false]);

    selected.value.set(POINTS[1]);

    await vi.waitFor(() => expect(markersOf(fixture).map(inView)).toEqual([true, true, true]));

    const before = map.getCenter().toArray();
    selected.value.set(POINTS[2]);

    await vi.waitFor(() => expect(isSelected(markersOf(fixture)[2])).toBe(true));
    expect(map.getCenter().toArray()).toEqual(before);
  });

  it('removes a map whose style has not loaded yet when the component is destroyed early', async () => {
    let releaseStyle!: (style: StyleSpecification) => void;
    TestBed.overrideProvider(MAP_RESOURCES, {
      useValue: {
        ...OFFLINE_MAP,
        loadStyle: () =>
          new Promise<StyleSpecification>((resolve) => {
            releaseStyle = resolve;
          }),
      },
    });
    const fixture = TestBed.createComponent(MapComponent);
    fixture.componentRef.setInput('props', { points: boundProperty<readonly MapPoint[]>(POINTS) });
    fixture.componentRef.setInput('surfaceId', 's1');
    fixture.componentRef.setInput('componentId', 'map');
    await fixture.whenStable();
    const canvas = fixture.nativeElement.querySelector('.cf-map-canvas')!;

    releaseStyle(OFFLINE_STYLE);
    // Microtasks only: the map exists now, but its style loads on the next frame.
    for (let i = 0; i < 20 && canvas.querySelector('.maplibregl-canvas') === null; i++) {
      await Promise.resolve();
    }
    expect(canvas.querySelector('.maplibregl-canvas')).not.toBeNull();

    fixture.destroy();

    expect(canvas.querySelector('.maplibregl-canvas')).toBeNull();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(markersOf(fixture)).toHaveLength(0);
  });

  it('omits the user marker when center is not set and survives clicks without selected', async () => {
    const fixture = await renderMap({ points: boundProperty<readonly MapPoint[]>(POINTS) });

    expect(fixture.nativeElement.querySelector('.cf-center')).toBeNull();
    expect(() => click(markersOf(fixture)[0])).not.toThrow();
  });

  // Inside the renderer's flex rows a height-less container collapses; the host gives the
  // canvas a fixed height and a minimum width.
  it('occupies real size inside a flex container', async () => {
    const fixture = await renderMap({ points: boundProperty<readonly MapPoint[]>(POINTS) });
    const host = fixture.nativeElement as HTMLElement;
    host.parentElement!.style.display = 'flex';

    const rect = host.querySelector('.cf-map-canvas')!.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(320);
    expect(rect.height).toBeGreaterThanOrEqual(250);
  });
});

const SURFACE_ID = 'map-selection-surface';

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

/** The remote's own host with a recording action handler — no shell code involved. */
function configureMapsHost(
  onAction: (action: A2uiClientAction) => void = () => undefined,
): A2uiRendererService {
  TestBed.configureTestingModule({
    providers: [
      provideA2Ui({ catalogs: [createMapsCatalog()], actionHandler: onAction }),
      // Mirrors app.config.ts: the basic `Text` injects the markdown renderer unconditionally.
      provideMarkdownRenderer((markdown) => renderMarkdown(String(markdown))),
      provideOfflineMap(),
    ],
  });
  return TestBed.inject(A2uiRendererService);
}

function createSurfaceMessage(): A2uiMessage {
  return {
    version: 'v0.9',
    createSurface: { surfaceId: SURFACE_ID, catalogId: MAPS_CATALOG_ID },
  };
}

async function renderSurface() {
  const fixture = TestBed.createComponent(SurfaceHost);
  await fixture.whenStable();
  await vi.waitFor(() => expect(markersOf(fixture)).toHaveLength(POINTS.length));
  return fixture;
}

describe('Map through the real renderer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T5-AC-04 dispatches the pick action with the resolved context to the action bus', async () => {
    const seen: A2uiClientAction[] = [];
    const renderer = configureMapsHost((action) => seen.push(action));
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
              points: { path: '/filteredConfs' },
              action: { event: { name: 'pick', context: { id: { path: '/x/id' } } } },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: POINTS },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: SURFACE_ID, path: '/x', value: { id: 'x-marks' } },
      },
    ]);

    const fixture = await renderSurface();
    click(markersOf(fixture)[0]);

    await vi.waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toMatchObject({
      name: 'pick',
      surfaceId: SURFACE_ID,
      context: { id: 'x-marks' },
    });
  });

  it('T5-AC-05 / T2-AC-02 clicking a marker writes the point to /selectedConf, rings it and re-renders a Text bound to /selectedConf/name without any fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const renderer = configureMapsHost();
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
              points: { path: '/filteredConfs' },
              selected: { path: '/selectedConf' },
            },
            { id: 'conf-name', component: 'Text', text: { path: '/selectedConf/name' } },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: SURFACE_ID,
          path: '/filteredConfs',
          value: POINTS.map(({ label, ...point }) => ({ ...point, name: `${label} Days` })),
        },
      },
    ]);

    const fixture = await renderSurface();

    // The assertion targets the Text component's element, not the whole DOM.
    const textEl = () => (fixture.nativeElement as HTMLElement).querySelector('a2ui-v09-text');
    expect(textEl()?.textContent ?? '').not.toContain('Munich Days');

    click(markersOf(fixture)[1]);
    await fixture.whenStable();

    await vi.waitFor(() => expect(textEl()?.textContent).toContain('Munich Days'));
    await vi.waitFor(() =>
      expect(markersOf(fixture).map(isSelected)).toEqual([false, true, false]),
    );
    const surface = renderer.surfaceGroup.getSurface(SURFACE_ID);
    expect(surface?.dataModel.get('/selectedConf')).toMatchObject({
      id: 'muc-conf',
      name: 'Munich Days',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

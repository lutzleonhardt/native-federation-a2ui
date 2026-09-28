import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../projects/mfe-maps/src/capability';
import { provideOfflineMap } from '../../../projects/mfe-maps/src/testing/offline-map';
import { provideAgentCapabilities } from './agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog';

const SURFACE_ID = 'renderer-spec-surface';

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

function gaugeSurfaceMessages(): A2uiMessage[] {
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
            component: 'Gauge',
            value: { path: '/selectedConf/remaining' },
            max: { path: '/selectedConf/capacity' },
            label: 'Tickets left',
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: SURFACE_ID,
        path: '/selectedConf',
        value: { remaining: 12, capacity: 100 },
      },
    },
  ];
}

const BERLIN = { city: 'Berlin', lat: 52.52, lon: 13.405 };
// About 150 and 504 km from Berlin.
const CONFS = [
  { id: 'ber', name: 'ng-berlin', lat: 52.52, lon: 13.405 },
  { id: 'lej', name: 'ng-leipzig', lat: 51.3397, lon: 12.3731 },
  { id: 'muc', name: 'ng-munich', lat: 48.1372, lon: 11.5756 },
];

/** A Slider writes `/filter/maxKm`; the Map's points are a `filterWithinKm` call over that path. */
function sliderMapMessages(): A2uiMessage[] {
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
          { id: 'root', component: 'Column', children: ['range', 'map'] },
          {
            id: 'range',
            component: 'Slider',
            label: 'Within km',
            min: 0,
            max: 800,
            value: { path: '/filter/maxKm' },
          },
          {
            id: 'map',
            component: 'Map',
            points: {
              call: 'filterWithinKm',
              args: {
                points: { path: '/filteredConfs' },
                center: { path: '/me' },
                maxKm: { path: '/filter/maxKm' },
              },
              returnType: 'array',
            },
            center: { path: '/me' },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: CONFS },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/me', value: BERLIN } },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/filter/maxKm', value: 300 },
    },
  ];
}

/** Two zeros: one bound by path, one the result of `distance` from Berlin to Berlin. */
function zeroTextMessages(): A2uiMessage[] {
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
          { id: 'root', component: 'Column', children: ['by-path', 'by-call'] },
          { id: 'by-path', component: 'Text', text: { path: '/selectedConf/remaining' } },
          {
            id: 'by-call',
            component: 'Text',
            text: {
              call: 'distance',
              args: { a: { path: '/me' }, b: { path: '/selectedConf' } },
              returnType: 'number',
            },
          },
        ],
      },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/me', value: BERLIN } },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: SURFACE_ID,
        path: '/selectedConf',
        value: { ...CONFS[0], remaining: 0 },
      },
    },
  ];
}

function markersOf(fixture: { nativeElement: HTMLElement }): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll<HTMLElement>('.cf-marker')];
}

describe('assistant catalog in the real renderer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAgentCapabilities([chartsCapability, mapsCapability]),
        provideOfflineMap(),
      ],
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('T4-AC-06 renders a Gauge bound to /selectedConf through createSurface + updateComponents + updateDataModel', async () => {
    TestBed.inject(A2uiRendererService).processMessages(gaugeSurfaceMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg');
    expect(svg?.textContent).toContain('12');
    expect(svg?.textContent).toContain('100');
    expect(host.querySelector('app-gauge')?.textContent).toContain('Tickets left');
  });

  it('T4-AC-06 re-renders the gauge when the bound data model path changes', async () => {
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages(gaugeSurfaceMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    renderer.processMessages([
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: SURFACE_ID, path: '/selectedConf/remaining', value: 3 },
      },
    ]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('svg')?.textContent).toContain('3');
  });

  it('T3.5-AC-01 the slider path drives the Map through filterWithinKm; no request leaves the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages(sliderMapMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const slider = host.querySelector<HTMLInputElement>('input[type="range"]');

    expect(slider?.value).toBe('300');
    await vi.waitFor(() => expect(markersOf(fixture)).toHaveLength(2));

    // The data model side, as a later message would write it.
    renderer.processMessages([
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: SURFACE_ID, path: '/filter/maxKm', value: 800 },
      },
    ]);
    await vi.waitFor(() => expect(markersOf(fixture)).toHaveLength(3));

    // The user side: the Slider's own input writes the same path.
    slider!.value = '100';
    slider!.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(markersOf(fixture)).toHaveLength(1));
    expect(markersOf(fixture)[0].dataset['id']).toBe('ber');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T3.5-AC-03 a basic Text bound to the number 0 renders "0", by path and by call', async () => {
    TestBed.inject(A2uiRendererService).processMessages(zeroTextMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    const texts = () =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('a2ui-v09-text')].map((text) =>
        text.textContent?.trim(),
      );
    await vi.waitFor(() => expect(texts()).toEqual(['0', '0']));
  });
});

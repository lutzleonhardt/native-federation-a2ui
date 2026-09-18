import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { beforeEach, describe, expect, it } from 'vitest';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../projects/mfe-maps/src/capability';
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
            label: 'Restkarten',
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

describe('assistant catalog in the real renderer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAgentCapabilities([chartsCapability, mapsCapability])],
    });
  });

  it('T4-AC-06 renders a Gauge bound to /selectedConf through createSurface + updateComponents + updateDataModel', async () => {
    TestBed.inject(A2uiRendererService).processMessages(gaugeSurfaceMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg');
    expect(svg?.textContent).toContain('12');
    expect(svg?.textContent).toContain('100');
    expect(svg?.textContent).toContain('Restkarten');
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
});

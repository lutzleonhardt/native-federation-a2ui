import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { MAPS_CATALOG_ID } from './maps-catalog';

const SURFACE_ID = 'lighthouses';

/** Literal and local on purpose: the vocabulary only asks for `lat`/`lon`, not for conferences. */
export const HOME = { lat: 53.5511, lon: 9.9937, city: 'Hamburg' };
export const LIGHTHOUSES = [
  { id: 'campen', label: 'Campen', lat: 53.4033, lon: 6.9997 },
  { id: 'roter-sand', label: 'Roter Sand', lat: 53.855, lon: 8.0837 },
  { id: 'westerheversand', label: 'Westerheversand', lat: 54.3753, lon: 8.6414 },
  { id: 'kiel-holtenau', label: 'Kiel-Holtenau', lat: 54.3717, lon: 10.1567 },
  { id: 'warnemuende', label: 'Warnemünde', lat: 54.1811, lon: 12.0856 },
  { id: 'kap-arkona', label: 'Kap Arkona', lat: 54.6792, lon: 13.4325 },
];

function lighthouseSurface(): A2uiMessage[] {
  const pick = { event: { name: 'pick', context: { id: { path: '/selected/id' } } } };
  return [
    { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: MAPS_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          { id: 'root', component: 'Column', children: ['map', 'details'] },
          {
            id: 'map',
            component: 'Map',
            points: { path: '/lighthouses' },
            center: { path: '/me' },
            selected: { path: '/selected' },
            action: pick,
          },
          { id: 'details', component: 'Row', children: ['name', 'distance'] },
          { id: 'name', component: 'Text', text: { path: '/selected/label' } },
          {
            id: 'distance',
            component: 'Text',
            text: {
              call: 'distance',
              args: { a: { path: '/me' }, b: { path: '/selected' } },
              returnType: 'number',
            },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/lighthouses', value: LIGHTHOUSES },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/me', value: HOME } },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/selected', value: LIGHTHOUSES[1] },
    },
  ];
}

/**
 * The remote's own face: a plain A2UI host (see `app.config.ts`) rendering a
 * hand-built surface, so the capability is seen working without the shell.
 */
@Component({
  selector: 'app-root',
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styles: `
    main {
      max-width: 48rem;
      margin: 0 auto;
      padding: 1rem;
    }
    .muted {
      color: #666;
    }
  `,
})
export class App {
  protected readonly surfaceId = SURFACE_ID;

  constructor() {
    inject(A2uiRendererService).processMessages(lighthouseSurface());
  }
}

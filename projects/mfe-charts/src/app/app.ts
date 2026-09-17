import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { CHARTS_CATALOG_ID } from './charts-catalog';

const SURFACE_ID = 'releases';

/** Literal and local on purpose: the vocabulary only asks for a `date`, not for conferences. */
export const RELEASES = [
  { id: 'v2.0', label: '2.0 "Aurora"', date: '2026-08-28', done: 48, planned: 48 },
  { id: 'v2.1', label: '2.1', date: '2026-10-09', done: 21, planned: 30 },
  { id: 'v2.2', label: '2.2', date: '2026-11-27', done: 4, planned: 26 },
  { id: 'v3.0', label: '3.0 "Borealis"', date: '2027-01-15', done: 0, planned: 61 },
];

function releaseSurface(): A2uiMessage[] {
  const pick = { event: { name: 'pick', context: { id: { path: '/selected/id' } } } };
  return [
    { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: CHARTS_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          { id: 'root', component: 'Column', children: ['timeline', 'details'] },
          {
            id: 'timeline',
            component: 'Timeline',
            items: { path: '/releases' },
            selected: { path: '/selected' },
            action: pick,
          },
          { id: 'details', component: 'Row', children: ['gauge', 'summary'] },
          {
            id: 'gauge',
            component: 'Gauge',
            value: { path: '/selected/done' },
            max: { path: '/selected/planned' },
            label: 'Issues closed',
          },
          { id: 'summary', component: 'Column', children: ['name', 'date', 'days'] },
          { id: 'name', component: 'Text', text: { path: '/selected/label' } },
          { id: 'date', component: 'Text', text: { path: '/selected/date' } },
          {
            id: 'days',
            component: 'Text',
            text: {
              call: 'daysUntil',
              args: { date: { path: '/selected/date' } },
              returnType: 'number',
            },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/releases', value: RELEASES },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/selected', value: RELEASES[1] },
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
    inject(A2uiRendererService).processMessages(releaseSurface());
  }
}

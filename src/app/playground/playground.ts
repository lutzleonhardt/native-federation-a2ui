import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { A2uiActionBus } from '../a2ui/action-bus';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { loadConferences } from '../domain/conference';
import { findConferences } from '../domain/find-conferences';

const SURFACE_ID = 'playground';
const BERLIN = { city: 'Berlin', lat: 52.52, lon: 13.405 };

/**
 * Dev showcase (plan amendment, Task 5): the app renders no agent-driven
 * surface before Task 7, so this page feeds the real renderer a hand-built
 * surface over the real conference data to make the catalog components
 * visible and clickable.
 */
function playgroundMessages(): A2uiMessage[] {
  const today = new Date();
  const { confs } = findConferences(
    { nearKm: 300 },
    { confs: loadConferences(today), me: BERLIN, today },
  );
  const pick = { event: { name: 'pick', context: { id: { path: '/selectedConf/id' } } } };

  return [
    { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          { id: 'root', component: 'Column', children: ['timeline', 'map', 'details'] },
          {
            id: 'timeline',
            component: 'Timeline',
            items: { path: '/filteredConfs' },
            selected: { path: '/selectedConf' },
            action: pick,
          },
          {
            id: 'map',
            component: 'Map',
            points: { path: '/filteredConfs' },
            center: { path: '/me' },
            selected: { path: '/selectedConf' },
            action: pick,
          },
          { id: 'details', component: 'Row', children: ['gauge', 'summary'] },
          {
            id: 'gauge',
            component: 'Gauge',
            value: { path: '/selectedConf/remaining' },
            max: { path: '/selectedConf/capacity' },
            label: 'Tickets left',
          },
          {
            id: 'summary',
            component: 'Column',
            children: ['conf-name', 'conf-date', 'conf-days', 'conf-city'],
          },
          { id: 'conf-name', component: 'Text', text: { path: '/selectedConf/name' } },
          { id: 'conf-date', component: 'Text', text: { path: '/selectedConf/date' } },
          {
            id: 'conf-days',
            component: 'Text',
            text: {
              call: 'daysUntil',
              args: { date: { path: '/selectedConf/date' } },
              returnType: 'number',
            },
          },
          { id: 'conf-city', component: 'Text', text: { path: '/selectedConf/city' } },
        ],
      },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: [...confs] } },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/me', value: BERLIN } },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/selectedConf', value: confs[0] } },
  ];
}

@Component({
  selector: 'app-playground',
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playground.html',
  styles: `
    section {
      max-width: 56rem;
      margin: 0 auto;
      padding: 1rem;
    }
    .muted {
      color: #666;
    }
  `,
})
export class Playground {
  protected readonly surfaceId = SURFACE_ID;
  protected readonly actions = signal<readonly string[]>([]);

  constructor() {
    inject(A2uiRendererService).processMessages(playgroundMessages());
    const unsubscribe = inject(A2uiActionBus).subscribe((action) => this.log(action));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  private log(action: A2uiClientAction): void {
    const entry = `${action.name} ${JSON.stringify(action.context)}`;
    this.actions.update((log) => [entry, ...log].slice(0, 5));
  }
}

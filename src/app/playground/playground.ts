import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import type { AngularToolCall } from '@copilotkit/angular';
import { A2uiActionBus } from '../a2ui/action-bus';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { MessageWidgetComponent } from '../agent/tools/message-widget.component';
import type { MessageWidgetArgs } from '../agent/tools/message-widget.definition';
import type { RenderSurfaceArgs } from '../agent/tools/render-surface.definition';
import { SurfaceToolRendererComponent } from '../agent/tools/surface-tool-renderer.component';
import { loadConferences } from '../domain/conference';
import { findConferences } from '../domain/find-conferences';

const SURFACE_ID = 'playground';
const BENCH_ID = 'playground-bench';
const FILTER_ID = 'playground-filter';
const BERLIN = { city: 'Berlin', lat: 52.52, lon: 13.405 };

/**
 * Dev showcase (plan amendment, Task 5): the app renders no agent-driven
 * surface before Task 7, so this page feeds the real renderer a hand-built
 * surface over the real conference data to make the catalog components
 * visible and clickable.
 */
function playgroundMessages(): A2uiMessage[] {
  const today = new Date();
  // The set of demo request 1: seven conferences whose labels share one rail.
  const { confs } = findConferences(
    { topic: 'angular', withinDays: 180 },
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
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: [...confs] },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/me', value: BERLIN } },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/selectedConf', value: confs[0] },
    },
  ];
}

/**
 * The slider filter of demo request 2: the Slider writes `/filter/maxKm`, the
 * Map's `points` and the Timeline's `items` are the same `filterWithinKm` call
 * over that path, so both follow the slider without a request. The nine Angular
 * conferences lie 0 to about 670 km from Berlin, so they come one at a time.
 * The Timeline's `range` is pinned to the full span, so its dots appear in place
 * instead of the axis rescaling to whatever is left.
 */
function filterMessages(): A2uiMessage[] {
  const today = new Date();
  const { confs } = findConferences(
    { topic: 'angular' },
    { confs: loadConferences(today), me: BERLIN, today },
  );
  const withinSlider = {
    call: 'filterWithinKm',
    args: {
      points: { path: '/filteredConfs' },
      center: { path: '/me' },
      maxKm: { path: '/filter/maxKm' },
    },
    returnType: 'array',
  };

  return [
    { version: 'v0.9', createSurface: { surfaceId: FILTER_ID, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: FILTER_ID,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['range', 'range-value', 'timeline', 'map'],
          },
          {
            id: 'range',
            component: 'Slider',
            label: 'Within km',
            min: 0,
            max: 800,
            value: { path: '/filter/maxKm' },
          },
          { id: 'range-value', component: 'Text', text: { path: '/filter/maxKm' } },
          {
            id: 'timeline',
            component: 'Timeline',
            items: withinSlider,
            range: { from: isoFromToday(0), to: confs[confs.length - 1].date },
          },
          { id: 'map', component: 'Map', points: withinSlider, center: { path: '/me' } },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: FILTER_ID, path: '/filteredConfs', value: [...confs] },
    },
    { version: 'v0.9', updateDataModel: { surfaceId: FILTER_ID, path: '/me', value: BERLIN } },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: FILTER_ID, path: '/filter/maxKm', value: 300 },
    },
  ];
}

const FACTS = [
  { key: 'date', caption: 'Date', value: '2026-09-22' },
  { key: 'distance', caption: 'Distance', value: '359 km' },
  { key: 'tickets', caption: 'Tickets left', value: '68 of 450' },
] as const;

const BUTTONS = ['default', 'primary', 'borderless'] as const;

function isoFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** `count` items from today, `stepDays` apart — only what the Timeline schema requires. */
function timelineItems(prefix: string, count: number, stepDays: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    label: `${prefix} ${index + 1}`,
    date: isoFromToday(index * stepDays),
  }));
}

/**
 * Bench for the visual language: the basic-catalog primitives every visual
 * task is checked on, next to the Berlin sample above. Caption/value pairs
 * appear grouped (a Column per pair) and flat (all in one Row) because the
 * prompt examples may or may not group them.
 */
function benchMessages(): A2uiMessage[] {
  const text = (id: string, content: string, variant?: string) => ({
    id,
    component: 'Text',
    text: content,
    ...(variant ? { variant } : {}),
  });
  const bench = (variant: string) => ({ event: { name: 'bench', context: { variant } } });

  return [
    { version: 'v0.9', createSurface: { surfaceId: BENCH_ID, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: BENCH_ID,
        components: [
          { id: 'root', component: 'Column', children: ['card', 'buttons', 'year', 'week'] },
          { id: 'card', component: 'Card', child: 'card-body' },
          {
            id: 'card-body',
            component: 'Column',
            children: ['card-title', 'grouped', 'divider', 'flat'],
          },
          text('card-title', 'ng-harbor Copenhagen', 'h3'),
          { id: 'grouped', component: 'Row', children: FACTS.map((fact) => `pair-${fact.key}`) },
          ...FACTS.flatMap((fact) => [
            {
              id: `pair-${fact.key}`,
              component: 'Column',
              children: [`cap-${fact.key}`, `val-${fact.key}`],
            },
            text(`cap-${fact.key}`, fact.caption, 'caption'),
            text(`val-${fact.key}`, fact.value),
          ]),
          { id: 'divider', component: 'Divider' },
          {
            id: 'flat',
            component: 'Row',
            children: FACTS.flatMap((fact) => [`flat-cap-${fact.key}`, `flat-val-${fact.key}`]),
          },
          ...FACTS.flatMap((fact) => [
            text(`flat-cap-${fact.key}`, fact.caption, 'caption'),
            text(`flat-val-${fact.key}`, fact.value),
          ]),
          { id: 'buttons', component: 'Row', children: BUTTONS.map((variant) => `btn-${variant}`) },
          ...BUTTONS.flatMap((variant) => [
            {
              id: `btn-${variant}`,
              component: 'Button',
              variant,
              child: `btn-${variant}-label`,
              action: bench(variant),
            },
            text(`btn-${variant}-label`, `${variant[0].toUpperCase()}${variant.slice(1)} button`),
          ]),
          { id: 'year', component: 'Timeline', items: { path: '/year' } },
          // Four talks in the first week of a quarter: the range squeezes them off the rail.
          {
            id: 'week',
            component: 'Timeline',
            items: { path: '/week' },
            range: { from: isoFromToday(0), to: isoFromToday(90) },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: BENCH_ID,
        path: '/year',
        value: timelineItems('Event', 30, 12),
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: BENCH_ID, path: '/week', value: timelineItems('Talk', 4, 2) },
    },
  ];
}

@Component({
  selector: 'app-playground',
  imports: [SurfaceComponent, MessageWidgetComponent, SurfaceToolRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playground.html',
  styleUrl: './playground.css',
})
export class Playground {
  protected readonly surfaceId = SURFACE_ID;
  protected readonly benchId = BENCH_ID;
  protected readonly filterId = FILTER_ID;
  protected readonly actions = signal<readonly string[]>([]);
  protected readonly messageCall: AngularToolCall<MessageWidgetArgs> = {
    args: {
      text: [
        'The **next conference** near you starts in 3 days — the details are in the surface above. _(Markdown)_',
        'Inline `code` and a fenced block:',
        '```\n{ "ok": true }\n```',
      ].join('\n\n'),
    },
    status: 'complete',
    result: JSON.stringify({ ok: true }),
  };
  // The two renderer states the chat shows only around a real call.
  protected readonly pendingCall: AngularToolCall<RenderSurfaceArgs> = {
    args: {},
    status: 'in-progress',
    result: undefined,
  };
  protected readonly failedCall: AngularToolCall<RenderSurfaceArgs> = {
    args: { messages: [] },
    status: 'complete',
    result: JSON.stringify({ ok: false, code: 'unknown_component' }),
  };

  constructor() {
    inject(A2uiRendererService).processMessages([
      ...playgroundMessages(),
      ...filterMessages(),
      ...benchMessages(),
    ]);
    const unsubscribe = inject(A2uiActionBus).subscribe((action) => this.log(action));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  private log(action: A2uiClientAction): void {
    const entry = `${action.name} ${JSON.stringify(action.context)}`;
    this.actions.update((log) => [entry, ...log].slice(0, 5));
  }
}

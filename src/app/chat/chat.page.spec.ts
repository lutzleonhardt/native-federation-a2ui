import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpAgent, type AbstractAgent } from '@ag-ui/client';
import type { BaseEvent, Context, RunAgentInput, ToolMessage } from '@ag-ui/core';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import type { AgentCapability } from '../../../shared/capabilities/agent-capability';
import { provideAgentCapabilities } from '../a2ui/agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { provideReserveHandler } from '../a2ui/reserve-handler';
import { ASSISTANT_AGENT, provideAssistantAgent } from '../agent/assistant-agent.token';
import { MAX_CORRECTIONS_PER_TURN } from '../agent/render-failure-correction';
import { SurfaceDataStore } from '../agent/surface-data.store';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../projects/mfe-maps/src/capability';
import { provideOfflineMap } from '../../../projects/mfe-maps/src/testing/offline-map';
import { LocationStore } from '../domain/location.store';
import type { CapabilityStatus } from '../federation/capability-status';
import { provideCapabilityStatus } from '../federation/capability-status.token';
import { PAGE_SEARCH } from '../federation/page-search.token';
import type { ReplayPace } from '../replay/paced-run';
import { NOT_RECORDED_TEXT, ReplayAgent } from '../replay/replay-agent';
import type { Recordings } from '../replay/recordings';
import { emptyRun, toolCallRun, toolCallsRun } from '../replay/scripted-run';
import { MockAgent } from '../testing/mock-agent';
import { ChatPage } from './chat.page';

/** The demo requests; the spec pins the literal texts, not the constant. */
const PROMPTS = [
  'Which Angular conferences are coming up in the next few months?',
  'Show them on a map',
  'Where and when is the next one near me? When I click one, I want details.',
  'Reserve a ticket for me',
];

const LOCAL: readonly AgentCapability[] = [chartsCapability, mapsCapability];
/** What the federation bootstrap reports with both remotes up. */
const REMOTES: readonly CapabilityStatus[] = [
  {
    name: 'charts',
    state: 'loaded',
    origin: 'http://localhost:4201/',
    capability: chartsCapability,
  },
  {
    name: 'maps',
    state: 'loaded',
    origin: 'http://localhost:4202/',
    capability: mapsCapability,
  },
];

async function renderChat(
  agent: AbstractAgent,
  capabilities: readonly AgentCapability[] = LOCAL,
): Promise<ComponentFixture<ChatPage>> {
  TestBed.configureTestingModule({
    providers: [
      provideAgentCapabilities(capabilities),
      provideCapabilityStatus(REMOTES),
      provideAssistantAgent({ mode: 'local' }),
      provideReserveHandler(),
      provideOfflineMap(),
      { provide: PAGE_SEARCH, useValue: '' },
      { provide: ASSISTANT_AGENT, useValue: agent },
    ],
  });
  const fixture = TestBed.createComponent(ChatPage);
  await fixture.whenStable();
  return fixture;
}

/** No pauses, one chunk per call — for the cases that look at what is played, not how it arrives. */
const INSTANT: ReplayPace = { thinkMs: 0, chunkMs: 0, chunkChars: Number.MAX_SAFE_INTEGER };

/** The real replay agent behind the real chat, as the deploy build wires it; `pace` replaces the live pacing. */
async function renderReplayChat(
  recordings: Recordings,
  pace?: ReplayPace,
): Promise<ComponentFixture<ChatPage>> {
  TestBed.configureTestingModule({
    providers: [
      provideAgentCapabilities(LOCAL),
      provideCapabilityStatus(REMOTES),
      provideAssistantAgent({ mode: 'replay', recordings }),
      provideReserveHandler(),
      provideOfflineMap(),
      { provide: PAGE_SEARCH, useValue: '' },
      ...(pace === undefined
        ? []
        : [
            {
              provide: ASSISTANT_AGENT,
              useFactory: () => new ReplayAgent(recordings, 'charts,maps', pace),
            },
          ]),
    ],
  });
  const fixture = TestBed.createComponent(ChatPage);
  await fixture.whenStable();
  return fixture;
}

function host(fixture: ComponentFixture<ChatPage>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function promptButtons(fixture: ComponentFixture<ChatPage>): HTMLButtonElement[] {
  return [...host(fixture).querySelectorAll<HTMLButtonElement>('.cf-prompts button')];
}

function clickPrompt(fixture: ComponentFixture<ChatPage>, index: number): void {
  promptButtons(fixture)[index].click();
}

function markersOf(fixture: ComponentFixture<ChatPage>): HTMLElement[] {
  return [...host(fixture).querySelectorAll<HTMLElement>('a2ui-v09-surface app-map .cf-marker')];
}

/** The gauge readings of every surface in the transcript, in message order. */
function gaugeValues(fixture: ComponentFixture<ChatPage>): string[] {
  return [...host(fixture).querySelectorAll('a2ui-v09-surface .cf-gauge-value')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function reserveButtons(fixture: ComponentFixture<ChatPage>): HTMLButtonElement[] {
  return [
    ...host(fixture).querySelectorAll<HTMLButtonElement>('a2ui-v09-surface a2ui-v09-button button'),
  ];
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

/** Render failures log on purpose; the loop tests would otherwise flood the output. */
function silenceRenderFailureLogs(): { errors: MockInstance } {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  return { errors: vi.spyOn(console, 'error').mockImplementation(() => undefined) };
}

function requestThreeSurface(surfaceId: string): unknown[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [
          { id: 'root', component: 'Row', children: ['map', 'details'] },
          {
            id: 'map',
            component: 'Map',
            points: { path: '/filteredConfs' },
            center: { path: '/me' },
            selected: { path: '/selectedConf' },
          },
          {
            id: 'details',
            component: 'Column',
            children: ['name', 'days', 'distance', 'gauge', 'reserve'],
          },
          { id: 'name', component: 'Text', text: { path: '/selectedConf/name' } },
          {
            id: 'days',
            component: 'Text',
            text: {
              call: 'daysUntil',
              args: { date: { path: '/selectedConf/date' } },
              returnType: 'number',
            },
          },
          {
            id: 'distance',
            component: 'Text',
            text: {
              call: 'distance',
              args: { a: { path: '/me' }, b: { path: '/selectedConf' } },
              returnType: 'number',
            },
          },
          {
            id: 'gauge',
            component: 'Gauge',
            value: { path: '/selectedConf/remaining' },
            max: { path: '/selectedConf/capacity' },
            label: 'Seats left',
          },
          { id: 'reserve-label', component: 'Text', text: 'Reserve' },
          {
            id: 'reserve',
            component: 'Button',
            child: 'reserve-label',
            action: { event: { name: 'reserve', context: { id: { path: '/selectedConf/id' } } } },
          },
        ],
      },
    },
  ];
}

function forbiddenWriteSurface(surfaceId: string): unknown[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [{ id: 'root', component: 'Text', text: { path: '/selectedConf/name' } }],
      },
    },
    { version: 'v0.9', updateDataModel: { surfaceId, path: '/me', value: { city: 'Atlantis' } } },
  ];
}

function timelineSurface(surfaceId: string): unknown[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [
          { id: 'root', component: 'Column', children: ['timeline', 'name'] },
          {
            id: 'timeline',
            component: 'Timeline',
            items: { path: '/filteredConfs' },
            selected: { path: '/selectedConf' },
          },
          { id: 'name', component: 'Text', text: { path: '/selectedConf/name' } },
        ],
      },
    },
  ];
}

/** Prompt 1 recorded for both remotes: the search, then the timeline — as `public/recordings.json` will hold it. */
const RECORDED_PROMPT_ONE: Recordings = {
  'charts,maps': {
    [PROMPTS[0]]: [
      [{ name: 'findConferences', args: { topic: 'angular' } }],
      [{ name: 'renderSurface', args: { messages: timelineSurface('upcoming') } }],
    ],
  },
};

function mapSurface(surfaceId: string): unknown[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [{ id: 'root', component: 'Map', points: { path: '/filteredConfs' } }],
      },
    },
  ];
}

function failingRenderSurface(input: RunAgentInput): BaseEvent[] {
  return toolCallRun(
    input,
    'renderSurface',
    { messages: forbiddenWriteSurface(`bad-${input.runId}`) },
    `call-${input.runId}`,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('ChatPage run requests through the HttpAgent', () => {
  function sseResponse(events: readonly BaseEvent[]): Response {
    const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  }

  /** Answers every run with an empty run and keeps the request bodies. */
  function agentWithRecordedRequests(): { agent: HttpAgent; requests: RunAgentInput[] } {
    const requests: RunAgentInput[] = [];
    const agent = new HttpAgent({
      agentId: ASSISTANT_AGENT_ID,
      url: 'http://agent.test/ag-ui/assistant',
      fetch: async (_url, init) => {
        const input = JSON.parse(String(init.body)) as RunAgentInput;
        requests.push(input);
        return sseResponse(emptyRun(input));
      },
    });
    return { agent, requests };
  }

  function meOf(request: RunAgentInput): unknown {
    const entry = request.context.find(
      (candidate: Context) => candidate.description === 'User location (me)',
    );
    return entry === undefined ? undefined : JSON.parse(entry.value);
  }

  it('T7-AC-01 sends the three client tools, the catalog entry and the me entry with every run', async () => {
    const { agent, requests } = agentWithRecordedRequests();
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 0);
    await vi.waitFor(() => expect(requests).toHaveLength(1));

    const [request] = requests;
    expect(request.tools.map((tool) => tool.name).sort()).toEqual([
      'findConferences',
      'messageWidget',
      'renderSurface',
    ]);
    const catalog = request.context.find((entry) => entry.description === 'A2UI Custom Catalog');
    expect(catalog?.value).toContain('"Gauge"');
    expect(catalog?.value).toContain('"daysUntil"');
    expect(request.context.some((entry) => entry.description === 'User location (me)')).toBe(true);
    expect(request.messages.at(-1)).toMatchObject({ role: 'user', content: PROMPTS[0] });
  });

  it('T7-AC-02 a city change reaches the me entry of the next run', async () => {
    const { agent, requests } = agentWithRecordedRequests();
    const fixture = await renderChat(agent);
    const location = TestBed.inject(LocationStore);

    location.setCity('berlin');
    await fixture.whenStable();
    clickPrompt(fixture, 1);
    await vi.waitFor(() => expect(requests).toHaveLength(1));
    expect(meOf(requests[0])).toMatchObject({ city: 'Berlin' });

    location.setCity('vienna');
    await fixture.whenStable();
    clickPrompt(fixture, 1);
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(meOf(requests[1])).toMatchObject({ city: 'Vienna' });
  });
});

describe('ChatPage with the scripted agent', () => {
  it('T7-AC-03 example 3 builds the request-3 surface, the second marker selects its conference, and fetch stays untouched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const agent = new MockAgent((input, run) => {
      if (run === 0) return toolCallRun(input, 'findConferences', { topic: 'angular' });
      if (run === 1)
        return toolCallRun(input, 'renderSurface', { messages: requestThreeSurface('request-3') });
      return emptyRun(input);
    });
    const fixture = await renderChat(agent);
    TestBed.inject(LocationStore).setCity('berlin');
    await fixture.whenStable();

    clickPrompt(fixture, 2);

    await vi.waitFor(() => expect(markersOf(fixture).length).toBeGreaterThanOrEqual(2));
    const [first, second] = TestBed.inject(SurfaceDataStore).confs();
    const nameText = () =>
      host(fixture).querySelector('a2ui-v09-surface a2ui-v09-text')?.textContent ?? '';
    await vi.waitFor(() => expect(nameText()).toContain(first.name));

    markersOf(fixture)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => expect(nameText()).toContain(second.name));
    // findConferences asks for a follow-up run, renderSurface ends the turn.
    expect(agent.inputs).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T1-AC-03 reserve in the chat: the gauge drops without a request, and the next answer starts from the reduced count', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const agent = new MockAgent((input, run) => {
      if (run === 0 || run === 2)
        return toolCallRun(input, 'findConferences', { topic: 'angular' });
      if (run === 1)
        return toolCallRun(input, 'renderSurface', { messages: requestThreeSurface('request-3') });
      if (run === 3)
        return toolCallRun(input, 'renderSurface', {
          messages: requestThreeSurface('request-3-again'),
        });
      return emptyRun(input);
    });
    const fixture = await renderChat(agent);
    TestBed.inject(LocationStore).setCity('berlin');
    await fixture.whenStable();

    clickPrompt(fixture, 2);
    await vi.waitFor(() => expect(gaugeValues(fixture)).toHaveLength(1));
    const [first] = TestBed.inject(SurfaceDataStore).confs();
    expect(gaugeValues(fixture)).toEqual([String(first.remaining)]);

    reserveButtons(fixture)[0].click();
    await vi.waitFor(() => expect(gaugeValues(fixture)).toEqual([String(first.remaining - 1)]));

    // renderSurface ended the turn, so the example buttons are usable again.
    await vi.waitFor(() =>
      expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false),
    );
    clickPrompt(fixture, 2);
    await vi.waitFor(() => expect(gaugeValues(fixture)).toHaveLength(2));

    expect(gaugeValues(fixture)).toEqual([
      String(first.remaining - 1),
      String(first.remaining - 1),
    ]);
    expect(agent.inputs).toHaveLength(4);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T7-AC-04 a rejected renderSurface starts exactly one correction run that answers the failed call with its issues', async () => {
    silenceRenderFailureLogs();
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallRun(
            input,
            'renderSurface',
            { messages: forbiddenWriteSurface('request-bad') },
            'call-bad',
          )
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 1);

    await vi.waitFor(() => expect(agent.inputs).toHaveLength(2));
    // The correction run waits for the tool result: it is the last message and
    // carries code and issues, so the model never sees an unanswered call.
    const last = agent.inputs[1].messages.at(-1) as ToolMessage;
    expect(last).toMatchObject({ role: 'tool', toolCallId: 'call-bad' });
    const outcome = JSON.parse(last.content) as { code: string; result: string };
    expect(outcome.code).toBe('forbidden_model_writes');
    expect(outcome.result).toContain('/me');

    await settle();
    expect(agent.inputs).toHaveLength(2);
  });

  it('T7-AC-04 several failures in one run share one correction run', async () => {
    silenceRenderFailureLogs();
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallsRun(input, [
            {
              name: 'renderSurface',
              args: { messages: forbiddenWriteSurface('bad-1') },
              toolCallId: 'call-1',
            },
            {
              name: 'renderSurface',
              args: { messages: forbiddenWriteSurface('bad-2') },
              toolCallId: 'call-2',
            },
          ])
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 1);

    await vi.waitFor(() => expect(agent.inputs).toHaveLength(2));
    expect(agent.inputs[1].messages.slice(-2).map((message) => message.role)).toEqual([
      'tool',
      'tool',
    ]);
    await settle();
    expect(agent.inputs).toHaveLength(2);
  });

  it('T7-AC-04 stops after three corrections per user turn; the next user message resets the budget', async () => {
    const { errors } = silenceRenderFailureLogs();
    const agent = new MockAgent((input) => failingRenderSurface(input));
    const fixture = await renderChat(agent);
    const runsPerTurn = 1 + MAX_CORRECTIONS_PER_TURN;

    clickPrompt(fixture, 1);
    await vi.waitFor(() => expect(agent.inputs).toHaveLength(runsPerTurn));
    await settle();
    expect(agent.inputs).toHaveLength(runsPerTurn);
    expect(errors).toHaveBeenCalledOnce();

    clickPrompt(fixture, 1);
    await vi.waitFor(() => expect(agent.inputs).toHaveLength(2 * runsPerTurn));
  });

  it('disables the example buttons while a run is in progress and ignores clicks meanwhile', async () => {
    const events = new Subject<BaseEvent>();
    const agent = new MockAgent((input, run) => (run === 0 ? events : emptyRun(input)));
    const fixture = await renderChat(agent);
    expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false);

    clickPrompt(fixture, 0);
    await vi.waitFor(() =>
      expect(promptButtons(fixture).every((button) => button.disabled)).toBe(true),
    );
    clickPrompt(fixture, 1);
    expect(agent.inputs).toHaveLength(1);

    for (const event of emptyRun(agent.inputs[0])) events.next(event);
    events.complete();

    await vi.waitFor(() =>
      expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false),
    );
    expect(agent.inputs).toHaveLength(1);
  });

  it('T7-AC-05 the four example buttons send exactly the demo texts as user messages', async () => {
    const agent = new MockAgent((input) => emptyRun(input));
    const fixture = await renderChat(agent);
    expect(promptButtons(fixture)).toHaveLength(4);

    for (const [index, text] of PROMPTS.entries()) {
      clickPrompt(fixture, index);
      await vi.waitFor(() => expect(agent.inputs).toHaveLength(index + 1));
      expect(agent.inputs[index].messages.at(-1)).toMatchObject({ role: 'user', content: text });
    }
  });

  it('T2-AC-01 with charts only: the context announces neither Map nor distance, and a Map surface is rejected as unknown', async () => {
    silenceRenderFailureLogs();
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallRun(input, 'renderSurface', { messages: mapSurface('request-map') }, 'call-map')
        : emptyRun(input),
    );
    const fixture = await renderChat(agent, [chartsCapability]);

    clickPrompt(fixture, 1);

    await vi.waitFor(() => expect(agent.inputs).toHaveLength(2));
    const catalog = agent.inputs[0].context.find(
      (entry) => entry.description === 'A2UI Custom Catalog',
    );
    const announced = JSON.parse(catalog?.value ?? '{}') as {
      components: Record<string, unknown>;
      functions: Record<string, unknown>;
    };
    expect(Object.keys(announced.components)).toEqual(['Gauge', 'Timeline']);
    expect(Object.keys(announced.functions)).toEqual(['daysUntil']);

    const last = agent.inputs[1].messages.at(-1) as ToolMessage;
    expect(last).toMatchObject({ role: 'tool', toolCallId: 'call-map' });
    const outcome = JSON.parse(last.content) as { code: string; result: string };
    expect(outcome.code).toBe('catalog');
    expect(outcome.result).toContain('Map');
  });

  it('the band carries the display name as its heading', async () => {
    const fixture = await renderChat(new MockAgent((input) => emptyRun(input)));
    expect(host(fixture).querySelector('header h1')?.textContent).toBe('Conference Finder');
  });

  it('the location picker offers the select without a city, then the city with Change, then the select again', async () => {
    const fixture = await renderChat(new MockAgent((input) => emptyRun(input)));
    const picker = () => host(fixture).querySelector('header app-location-picker') as HTMLElement;
    const select = () => picker().querySelector('select') as HTMLSelectElement | null;
    expect(select()?.labels?.[0]?.textContent).toContain('Your location');
    expect(picker().querySelector('button')).toBeNull();

    TestBed.inject(LocationStore).setCity('berlin');
    await fixture.whenStable();
    expect(picker().querySelector('select')).toBeNull();
    expect(picker().querySelector('.cf-city')?.textContent).toBe('Berlin');

    const changeButton = picker().querySelector('button') as HTMLButtonElement;
    changeButton.click();
    await fixture.whenStable();
    const reopened = select() as HTMLSelectElement;
    expect(reopened.value).toBe('berlin');
    expect(reopened.labels?.[0]?.textContent).toContain('Your location');

    reopened.value = 'vienna';
    reopened.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(picker().querySelector('select')).toBeNull();
    expect(picker().querySelector('.cf-city')?.textContent).toBe('Vienna');
  });

  it('T5-AC-01 the header carries the capability panel with the loaded charts remote', async () => {
    const agent = new MockAgent((input) => emptyRun(input));
    const fixture = await renderChat(agent);

    const panel = host(fixture).querySelector('header app-capability-panel');
    expect(panel?.textContent).toContain('charts');
    expect(panel?.textContent).toContain('http://localhost:4201/');
    expect(panel?.textContent).toContain('http://localhost:4202/');
    // The first link switches charts off and leaves maps selected.
    expect(panel?.querySelector('a')?.getAttribute('href')).toBe('?capabilities=maps');
  });

  // The agent prompt asks for this shape when a requested view is missing: both
  // tools end the turn, so text and substitute surface arrive in one message.
  it('shows a messageWidget text and a surface emitted in one assistant message, without a follow-up run', async () => {
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallsRun(input, [
            { name: 'messageWidget', args: { text: 'There is no **timeline** here.' } },
            { name: 'renderSurface', args: { messages: mapSurface('text-and-surface') } },
          ])
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 1);

    await vi.waitFor(() => {
      expect(
        host(fixture).querySelector('copilot-chat app-message-widget strong')?.textContent,
      ).toBe('timeline');
      expect(host(fixture).querySelector('copilot-chat app-map')).not.toBeNull();
    });
    await settle();
    expect(agent.inputs).toHaveLength(1);
  });

  it('T7-AC-06 messageWidget renders its markdown text inside the chat', async () => {
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallRun(input, 'messageWidget', { text: 'The **next** conference is close.' })
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 0);

    await vi.waitFor(() =>
      expect(
        host(fixture).querySelector('copilot-chat app-message-widget strong')?.textContent,
      ).toBe('next'),
    );
    // messageWidget ends the turn: no follow-up run.
    expect(agent.inputs).toHaveLength(1);
  });
});

describe('ChatPage in replay mode', () => {
  /** The replay agent delays every run like a model would; two runs per answer need the room. */
  function waitForReplay(check: () => void): Promise<void> {
    return vi.waitFor(check, { timeout: 10000 });
  }

  function timelineMarkers(fixture: ComponentFixture<ChatPage>): HTMLElement[] {
    return [
      ...host(fixture).querySelectorAll<HTMLElement>('a2ui-v09-surface app-timeline .cf-marker'),
    ];
  }

  function surfaces(fixture: ComponentFixture<ChatPage>): number {
    return host(fixture).querySelectorAll('a2ui-v09-surface').length;
  }

  function widgetText(fixture: ComponentFixture<ChatPage>): string {
    return host(fixture).querySelector('copilot-chat app-message-widget')?.textContent ?? '';
  }

  it('T3-AC-01 a click plays the recorded surface over the client data and no request leaves the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = await renderReplayChat(RECORDED_PROMPT_ONE);
    expect(host(fixture).dataset['agentMode']).toBe('replay');

    clickPrompt(fixture, 0);

    // The live pace: a reasoning line first, then "Building surface …", then the surface.
    await waitForReplay(() => expect(host(fixture).querySelector('.cf-thinking')).not.toBeNull());
    expect(surfaces(fixture)).toBe(0);
    await waitForReplay(() => expect(host(fixture).textContent).toContain('Building surface'));
    await waitForReplay(() => expect(timelineMarkers(fixture).length).toBeGreaterThan(0));
    expect(host(fixture).querySelectorAll('.cf-thinking')).toHaveLength(2);
    const first = TestBed.inject(SurfaceDataStore).confs()[0];
    await waitForReplay(() =>
      expect(host(fixture).querySelector('a2ui-v09-surface a2ui-v09-text')?.textContent).toContain(
        first.name,
      ),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it('T3-AC-02 the same prompt twice renders twice; the transcript grows and nothing is rejected', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = await renderReplayChat(RECORDED_PROMPT_ONE, INSTANT);

    clickPrompt(fixture, 0);
    await waitForReplay(() => expect(surfaces(fixture)).toBe(1));
    await waitForReplay(() => expect(promptButtons(fixture)[0].disabled).toBe(false));
    clickPrompt(fixture, 0);
    await waitForReplay(() => expect(surfaces(fixture)).toBe(2));

    await waitForReplay(() => expect(timelineMarkers(fixture).length).toBeGreaterThan(1));
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
  });

  it('T3-AC-02 prompts in any order: a one-run recording, a two-run recording and the first again all render', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const recordings: Recordings = {
      'charts,maps': {
        ...RECORDED_PROMPT_ONE['charts,maps'],
        [PROMPTS[1]]: [[{ name: 'renderSurface', args: { messages: mapSurface('on-a-map') } }]],
      },
    };
    const fixture = await renderReplayChat(recordings, INSTANT);
    const idle = () => waitForReplay(() => expect(promptButtons(fixture)[0].disabled).toBe(false));

    clickPrompt(fixture, 1);
    await waitForReplay(() => expect(surfaces(fixture)).toBe(1));
    await idle();
    clickPrompt(fixture, 0);
    await waitForReplay(() => expect(surfaces(fixture)).toBe(2));
    await idle();
    clickPrompt(fixture, 1);
    await waitForReplay(() => expect(surfaces(fixture)).toBe(3));

    expect(host(fixture).querySelectorAll('a2ui-v09-surface app-map')).toHaveLength(2);
    expect(host(fixture).querySelectorAll('a2ui-v09-surface app-timeline')).toHaveLength(1);
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
  });

  it('T3-AC-03 free text answers with the not-recorded text and nothing else', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const fixture = await renderReplayChat(RECORDED_PROMPT_ONE, INSTANT);

    fixture.componentInstance['send']('Any conferences in Lisbon?');

    await waitForReplay(() => expect(widgetText(fixture)).toContain('no recorded answer'));
    expect(widgetText(fixture)).toContain('npm start');
    expect(NOT_RECORDED_TEXT).toContain('npm start');
    await settle();
    expect(surfaces(fixture)).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T3-AC-05 the notice sits above the chat in replay mode only, and opens the panel; the DevTools link is there in both modes', async () => {
    const replay = await renderReplayChat({});
    const notice = host(replay).querySelector('header .cf-replay') as HTMLElement;
    expect(notice.textContent).toContain('Replay mode');
    expect(notice.textContent).toContain('no model, no server');
    const details = host(replay).querySelector(
      'app-capability-panel details',
    ) as HTMLDetailsElement;
    expect(details.open).toBe(false);
    (notice.querySelector('button') as HTMLButtonElement).click();
    expect(details.open).toBe(true);
    expect(
      host(replay).querySelector('a[href="https://native-federation.com/docs/v4/devtools/"]'),
    ).not.toBeNull();
    expect(host(replay).querySelector('.cf-mode')?.textContent).toContain('replay');

    TestBed.resetTestingModule();
    const local = await renderChat(new MockAgent((input) => emptyRun(input)));
    expect(host(local).dataset['agentMode']).toBe('local');
    expect(host(local).querySelector('header .cf-replay')).toBeNull();
    expect(
      host(local).querySelector('a[href="https://native-federation.com/docs/v4/devtools/"]'),
    ).not.toBeNull();
    expect(host(local).querySelector('.cf-mode')?.textContent).toContain('localhost:3001');
  });
});

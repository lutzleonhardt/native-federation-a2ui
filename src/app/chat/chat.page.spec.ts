import { TestBed } from '@angular/core/testing';
import { HttpAgent } from '@ag-ui/client';
import type { BaseEvent, Context, RunAgentInput, ToolMessage } from '@ag-ui/core';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { MAX_CORRECTIONS_PER_TURN } from '../agent/render-failure-correction';
import { SurfaceDataStore } from '../agent/surface-data.store';
import { LocationStore } from '../domain/location.store';
import { RECORDINGS_STORAGE_KEY, type RecordingsFile } from '../replay/recorder';
import { parseRecordings, type Recordings } from '../replay/recordings';
import { NOT_RECORDED_TEXT } from '../replay/replay-agent';
import { emptyRun, toolCallRun, toolCallsRun } from '../replay/scripted-run';
import { MockAgent } from '../testing/mock-agent';
import {
  clickPrompt,
  gaugeValues,
  host,
  INSTANT,
  markersOf,
  promptButtons,
  renderChat,
  renderReplayChat,
  reserveButtons,
  settle,
  surfaces,
  timelineMarkers,
  widgetText,
} from './testing/chat-page-harness';

/** The demo requests; the spec pins the literal texts, not the constant. */
const PROMPTS = [
  'Which Angular conferences are coming up in the next six months?',
  'Where are the Angular conferences around me? Let me narrow them down by distance with a slider.',
  'Compare the next three Angular conferences: date, city, ticket price and tickets left.',
  'Where and when is the next Angular conference near me? When I click one, I want details and a way to reserve a seat.',
];

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
  it('T7-AC-03 badge 4 builds the detail surface, the second marker selects its conference, and fetch stays untouched', async () => {
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

    clickPrompt(fixture, 3);

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

    clickPrompt(fixture, 3);
    await vi.waitFor(() => expect(gaugeValues(fixture)).toHaveLength(1));
    const [first] = TestBed.inject(SurfaceDataStore).confs();
    expect(gaugeValues(fixture)).toEqual([String(first.remaining)]);

    reserveButtons(fixture)[0].click();
    await vi.waitFor(() => expect(gaugeValues(fixture)).toEqual([String(first.remaining - 1)]));

    // renderSurface ended the turn, so the example buttons are usable again.
    await vi.waitFor(() =>
      expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false),
    );
    clickPrompt(fixture, 3);
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
    const fixture = await renderChat(agent, { loaded: ['charts'] });

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
    const fixture = await renderReplayChat(RECORDED_PROMPT_ONE, { pace: INSTANT });

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
    const fixture = await renderReplayChat(recordings, { pace: INSTANT });
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
    const fixture = await renderReplayChat(RECORDED_PROMPT_ONE, { pace: INSTANT });

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

describe('ChatPage with the recorder', () => {
  /** A live turn with a correction, then a plain answer to the next prompt. */
  function correctedThenPlain(): MockAgent {
    return new MockAgent((input, run) => {
      if (run === 0) return toolCallRun(input, 'findConferences', { topic: 'angular' });
      if (run === 1)
        return toolCallRun(input, 'renderSurface', { messages: forbiddenWriteSurface('refused') });
      if (run === 2)
        return toolCallRun(input, 'renderSurface', { messages: requestThreeSurface('accepted') });
      if (run === 3) return toolCallRun(input, 'messageWidget', { text: 'Plain.' });
      return emptyRun(input);
    });
  }

  /** One plain answer, then nothing — a turn the recorder would write. */
  function plainAnswer(): MockAgent {
    return new MockAgent((input, run) =>
      run === 0 ? toolCallRun(input, 'messageWidget', { text: 'Plain.' }) : emptyRun(input),
    );
  }

  function storedFile(): RecordingsFile {
    return JSON.parse(localStorage.getItem(RECORDINGS_STORAGE_KEY) ?? 'null') as RecordingsFile;
  }

  function recorderWarnings(warnings: MockInstance): string[] {
    return warnings.mock.calls.flatMap(([first]) =>
      typeof first === 'string' && first.startsWith('[recorder]') ? [first] : [],
    );
  }

  /** The files the recorder logged; the renderer logs other things on its own. */
  function loggedFiles(logs: MockInstance): string[] {
    return logs.mock.calls.flatMap(([first]) =>
      typeof first === 'string' && first.includes('"recordings"') ? [first] : [],
    );
  }

  it('T4.5-AC-04 with ?record in local mode the turn lands in localStorage and the console, without the refused run, in the shape parseRecordings accepts', async () => {
    silenceRenderFailureLogs();
    const logs = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const fixture = await renderChat(correctedThenPlain(), { record: true });
    TestBed.inject(LocationStore).setCity('dresden');

    clickPrompt(fixture, 3);
    await vi.waitFor(() => expect(gaugeValues(fixture)).toHaveLength(1));
    await vi.waitFor(() =>
      expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toContain('accepted'),
    );

    const file = storedFile();
    expect(file).toMatchObject({ format: 1, a2ui: 'v0.9', city: 'dresden' });
    expect(file.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(file.note).toContain('Re-record');
    expect(parseRecordings(file)).toEqual({
      'charts,maps': {
        [PROMPTS[3]]: [
          [{ name: 'findConferences', args: { topic: 'angular' } }],
          [{ name: 'renderSurface', args: { messages: requestThreeSurface('accepted') } }],
        ],
      },
    });
    expect(loggedFiles(logs).at(-1)).toBe(localStorage.getItem(RECORDINGS_STORAGE_KEY));

    // The next prompt adds its own cell; the first stays as recorded.
    await vi.waitFor(() =>
      expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false),
    );
    clickPrompt(fixture, 0);
    await vi.waitFor(() => expect(widgetText(fixture)).toContain('Plain.'));
    await vi.waitFor(() =>
      expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toContain('Plain.'),
    );
    const recordings = parseRecordings(storedFile());
    expect(Object.keys(recordings['charts,maps'])).toEqual([PROMPTS[3], PROMPTS[0]]);
    expect(recordings['charts,maps'][PROMPTS[0]]).toEqual([
      [{ name: 'messageWidget', args: { text: 'Plain.' } }],
    ]);
  });

  it('T4.5-AC-05 without a city picked the turn is not written and the console says so', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = await renderChat(plainAnswer(), { record: true });

    clickPrompt(fixture, 0);
    await vi.waitFor(() => expect(widgetText(fixture)).toContain('Plain.'));
    await settle();

    expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toBeNull();
    expect(recorderWarnings(warnings).at(-1)).toContain('no city picked');
  });

  it('T4.5-AC-05 a stored file from another city is left alone and the console names both cities', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const berlinFile = JSON.stringify({
      format: 1,
      a2ui: 'v0.9',
      capturedAt: '2026-09-29',
      city: 'berlin',
      note: '',
      recordings: {},
    });
    localStorage.setItem(RECORDINGS_STORAGE_KEY, berlinFile);
    const fixture = await renderChat(plainAnswer(), { record: true });
    TestBed.inject(LocationStore).setCity('dresden');

    clickPrompt(fixture, 0);
    await vi.waitFor(() => expect(widgetText(fixture)).toContain('Plain.'));
    await settle();

    expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toBe(berlinFile);
    expect(recorderWarnings(warnings).at(-1)).toContain(
      'captured in "berlin", this page is in "dresden"',
    );
  });

  it('T4.5-AC-04 without ?record, and in replay mode, nothing is stored or logged', async () => {
    const logs = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const local = await renderChat(plainAnswer());
    clickPrompt(local, 0);
    await vi.waitFor(() => expect(widgetText(local)).toContain('Plain.'));
    await settle();
    expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toBeNull();
    expect(loggedFiles(logs)).toEqual([]);

    TestBed.resetTestingModule();
    const replay = await renderReplayChat(RECORDED_PROMPT_ONE, { pace: INSTANT });
    clickPrompt(replay, 0);
    await vi.waitFor(() => expect(surfaces(replay)).toBe(1), { timeout: 10000 });
    await settle();
    expect(localStorage.getItem(RECORDINGS_STORAGE_KEY)).toBeNull();
    expect(loggedFiles(logs)).toEqual([]);
  });
});

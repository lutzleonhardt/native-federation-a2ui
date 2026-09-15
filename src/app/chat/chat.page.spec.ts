import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpAgent, type AbstractAgent } from '@ag-ui/client';
import type { BaseEvent, Context, RunAgentInput, ToolMessage } from '@ag-ui/core';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import type { AgentCapability } from '../../../shared/capabilities/agent-capability';
import { provideAgentCapabilities } from '../a2ui/agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { ASSISTANT_AGENT, provideAssistantAgent } from '../agent/assistant-agent.token';
import { MAX_CORRECTIONS_PER_TURN } from '../agent/render-failure-correction';
import { SurfaceDataStore } from '../agent/surface-data.store';
import { chartsCapability } from '../capabilities/charts';
import { mapsCapability } from '../capabilities/maps';
import { LocationStore } from '../domain/location.store';
import { emptyRun, MockAgent, toolCallRun, toolCallsRun } from '../testing/mock-agent';
import { ChatPage } from './chat.page';

/** The demo requests as the plan spells them; the spec pins the literal texts, not the constant. */
const PROMPTS = [
  'Welche Angular-Konferenzen gibt es in den nächsten Monaten?',
  'Zeig sie auf einer Karte',
  'Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details.',
  'Reservier mir eine Karte',
];

const LOCAL: readonly AgentCapability[] = [chartsCapability, mapsCapability];

async function renderChat(
  agent: AbstractAgent,
  capabilities: readonly AgentCapability[] = LOCAL,
): Promise<ComponentFixture<ChatPage>> {
  TestBed.configureTestingModule({
    providers: [
      provideAgentCapabilities(capabilities),
      provideAssistantAgent(),
      { provide: ASSISTANT_AGENT, useValue: agent },
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

function markersOf(fixture: ComponentFixture<ChatPage>): SVGGElement[] {
  return [...host(fixture).querySelectorAll<SVGGElement>('a2ui-v09-surface g.cf-marker')];
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
          { id: 'details', component: 'Column', children: ['name', 'days', 'distance', 'gauge', 'reserve'] },
          { id: 'name', component: 'Text', text: { path: '/selectedConf/name' } },
          {
            id: 'days',
            component: 'Text',
            text: { call: 'daysUntil', args: { date: { path: '/selectedConf/date' } }, returnType: 'number' },
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
    const entry = request.context.find((candidate: Context) => candidate.description === 'User location (me)');
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

    location.setCity('wien');
    await fixture.whenStable();
    clickPrompt(fixture, 1);
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(meOf(requests[1])).toMatchObject({ city: 'Wien' });
  });
});

describe('ChatPage with the scripted agent', () => {
  it('T7-AC-03 example 3 builds the request-3 surface, the second marker selects its conference, and fetch stays untouched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const agent = new MockAgent((input, run) => {
      if (run === 0) return toolCallRun(input, 'findConferences', { topic: 'angular' });
      if (run === 1) return toolCallRun(input, 'renderSurface', { messages: requestThreeSurface('request-3') });
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

  it('T7-AC-04 a rejected renderSurface starts exactly one correction run that answers the failed call with its issues', async () => {
    silenceRenderFailureLogs();
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallRun(input, 'renderSurface', { messages: forbiddenWriteSurface('request-bad') }, 'call-bad')
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
            { name: 'renderSurface', args: { messages: forbiddenWriteSurface('bad-1') }, toolCallId: 'call-1' },
            { name: 'renderSurface', args: { messages: forbiddenWriteSurface('bad-2') }, toolCallId: 'call-2' },
          ])
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 1);

    await vi.waitFor(() => expect(agent.inputs).toHaveLength(2));
    expect(agent.inputs[1].messages.slice(-2).map((message) => message.role)).toEqual(['tool', 'tool']);
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
    await vi.waitFor(() => expect(promptButtons(fixture).every((button) => button.disabled)).toBe(true));
    clickPrompt(fixture, 1);
    expect(agent.inputs).toHaveLength(1);

    for (const event of emptyRun(agent.inputs[0])) events.next(event);
    events.complete();

    await vi.waitFor(() => expect(promptButtons(fixture).some((button) => button.disabled)).toBe(false));
    expect(agent.inputs).toHaveLength(1);
  });

  it('T7-AC-05 the four example buttons send exactly the German texts as user messages', async () => {
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
    const catalog = agent.inputs[0].context.find((entry) => entry.description === 'A2UI Custom Catalog');
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

  it('T7-AC-06 messageWidget renders its markdown text inside the chat', async () => {
    const agent = new MockAgent((input, run) =>
      run === 0
        ? toolCallRun(input, 'messageWidget', { text: 'The **next** conference is close.' })
        : emptyRun(input),
    );
    const fixture = await renderChat(agent);

    clickPrompt(fixture, 0);

    await vi.waitFor(() =>
      expect(host(fixture).querySelector('copilot-chat app-message-widget strong')?.textContent).toBe('next'),
    );
    // messageWidget ends the turn: no follow-up run.
    expect(agent.inputs).toHaveLength(1);
  });
});

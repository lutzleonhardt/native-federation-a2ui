import { EventType, type BaseEvent, type Message, type RunAgentInput } from '@ag-ui/core';
import { lastValueFrom, toArray } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReplayPace } from './paced-run';
import { parseRecordings, type Recordings } from './recordings';
import { NOT_RECORDED_TEXT, ReplayAgent } from './replay-agent';

const PROMPT = 'Which Angular conferences are coming up in the next few months?';

/** No pauses, one chunk per call: the specs look at what is played, not at how fast. */
const INSTANT: ReplayPace = { thinkMs: 0, chunkMs: 0, chunkChars: Number.MAX_SAFE_INTEGER };

const SURFACE = [
  { version: 'v0.9', createSurface: { surfaceId: 'upcoming', catalogId: 'catalog' } },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: 'upcoming',
      components: [{ id: 'root', component: 'Timeline', items: { path: '/filteredConfs' } }],
    },
  },
];

const RECORDINGS: Recordings = {
  'charts,maps': {
    [PROMPT]: [
      [{ name: 'findConferences', args: { topic: 'angular' } }],
      [{ name: 'renderSurface', args: { messages: SURFACE } }],
    ],
  },
  charts: {
    [PROMPT]: [[{ name: 'messageWidget', args: { text: 'charts only' } }]],
  },
};

function user(content: string): Message {
  return { id: `u-${content.length}`, role: 'user', content };
}

function assistantToolCall(name: string): Message {
  return {
    id: `a-${name}`,
    role: 'assistant',
    toolCalls: [{ id: `tc-${name}`, type: 'function', function: { name, arguments: '{}' } }],
  };
}

function toolResult(name: string): Message {
  return { id: `t-${name}`, role: 'tool', toolCallId: `tc-${name}`, content: '{"ok":true}' };
}

function input(messages: Message[], runId = 'run-1'): RunAgentInput {
  return { threadId: 'thread', runId, messages, tools: [], context: [], state: {} };
}

function play(agent: ReplayAgent, run: RunAgentInput): Promise<BaseEvent[]> {
  return lastValueFrom(agent.run(run).pipe(toArray()));
}

/** The tool calls of a run as (name, parsed args) pairs, from the streamed events. */
function callsOf(events: BaseEvent[]): { name: string; args: unknown }[] {
  const names = new Map<string, string>();
  const args = new Map<string, string>();
  for (const event of events) {
    if (event.type === EventType.TOOL_CALL_START) {
      const start = event as BaseEvent & { toolCallId: string; toolCallName: string };
      names.set(start.toolCallId, start.toolCallName);
    }
    if (event.type === EventType.TOOL_CALL_ARGS) {
      const chunk = event as BaseEvent & { toolCallId: string; delta: string };
      args.set(chunk.toolCallId, (args.get(chunk.toolCallId) ?? '') + chunk.delta);
    }
  }
  return [...names].map(([id, name]) => ({ name, args: JSON.parse(args.get(id) ?? 'null') }));
}

function surfaceIdsOf(args: unknown): string[] {
  const { messages } = args as { messages: Record<string, { surfaceId: string }>[] };
  return messages.map(
    (message) => Object.values(message).find((v) => typeof v === 'object')!.surfaceId,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('ReplayAgent', () => {
  it('T3-AC-01 plays the recording of the loaded set and the clicked prompt, run by run', async () => {
    const agent = new ReplayAgent(RECORDINGS, 'charts,maps', INSTANT);

    const first = await play(agent, input([user(PROMPT)]));
    expect(callsOf(first)).toEqual([{ name: 'findConferences', args: { topic: 'angular' } }]);

    const followUp = await play(
      agent,
      input(
        [user(PROMPT), assistantToolCall('findConferences'), toolResult('findConferences')],
        'run-2',
      ),
    );
    expect(callsOf(followUp).map((call) => call.name)).toEqual(['renderSurface']);
  });

  it('T3-AC-01 the set decides: charts alone has its own answer to the same prompt', async () => {
    const agent = new ReplayAgent(RECORDINGS, 'charts', INSTANT);

    const events = await play(agent, input([user(PROMPT)]));
    expect(callsOf(events)).toEqual([{ name: 'messageWidget', args: { text: 'charts only' } }]);
  });

  it('T3-AC-01 ignores the history before the last user message; ids derive from the run', async () => {
    const agent = new ReplayAgent(RECORDINGS, 'charts,maps', INSTANT);
    const history = [
      user('Show them on a map'),
      assistantToolCall('messageWidget'),
      toolResult('messageWidget'),
      user(PROMPT),
    ];

    const events = await play(agent, input(history, 'run-7'));

    expect(events[0]).toEqual({ type: EventType.RUN_STARTED, threadId: 'thread', runId: 'run-7' });
    expect(events.at(-1)).toEqual({
      type: EventType.RUN_FINISHED,
      threadId: 'thread',
      runId: 'run-7',
    });
    expect(callsOf(events).map((call) => call.name)).toEqual(['findConferences']);
    expect(events.find((event) => event.type === EventType.TOOL_CALL_START)).toMatchObject({
      toolCallId: 'findConferences-run-7-0',
      parentMessageId: 'message-run-7',
    });
  });

  it('T3-AC-02 every playback gets surface ids of its own, on every message of the surface', async () => {
    const agent = new ReplayAgent(RECORDINGS, 'charts,maps', INSTANT);
    const turn = [
      user(PROMPT),
      assistantToolCall('findConferences'),
      toolResult('findConferences'),
    ];

    const first = callsOf(await play(agent, input(turn, 'run-a')))[0];
    const second = callsOf(await play(agent, input(turn, 'run-b')))[0];

    expect(surfaceIdsOf(first.args)).toEqual(['upcoming-run-a', 'upcoming-run-a']);
    expect(surfaceIdsOf(second.args)).toEqual(['upcoming-run-b', 'upcoming-run-b']);
    // The recording itself is untouched.
    expect(surfaceIdsOf(RECORDINGS['charts,maps'][PROMPT][1][0].args)).toEqual([
      'upcoming',
      'upcoming',
    ]);
  });

  it('T3-AC-02 a run beyond the recorded ones is empty, so a correction run cannot loop', async () => {
    const agent = new ReplayAgent(RECORDINGS, 'charts,maps', INSTANT);
    const afterRender = [
      user(PROMPT),
      assistantToolCall('findConferences'),
      toolResult('findConferences'),
      assistantToolCall('renderSurface'),
      toolResult('renderSurface'),
    ];

    const events = await play(agent, input(afterRender));

    expect(callsOf(events)).toEqual([]);
    expect(events[0]).toMatchObject({ type: EventType.RUN_STARTED });
    expect(events.at(-1)).toMatchObject({ type: EventType.RUN_FINISHED });
  });

  it('T3-AC-03 free text, a foreign set and a missing prompt all answer with the not-recorded text', async () => {
    const both = new ReplayAgent(RECORDINGS, 'charts,maps', INSTANT);
    const none = new ReplayAgent(RECORDINGS, '', INSTANT);
    const notRecorded = [{ name: 'messageWidget', args: { text: NOT_RECORDED_TEXT } }];

    expect(callsOf(await play(both, input([user('Any conferences in Lisbon?')])))).toEqual(
      notRecorded,
    );
    expect(callsOf(await play(none, input([user(PROMPT)])))).toEqual(notRecorded);
    expect(callsOf(await play(both, input([assistantToolCall('messageWidget')])))).toEqual(
      notRecorded,
    );
    expect(callsOf(await play(both, input([user('constructor')])))).toEqual(notRecorded);
    expect(callsOf(await play(both, input([user('__proto__')])))).toEqual(notRecorded);
    expect(NOT_RECORDED_TEXT).toContain('npm start');
  });

  it('T3-AC-06 a refused file leaves every prompt not recorded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const agent = new ReplayAgent(
      parseRecordings({ format: 0, a2ui: 'v0.9', recordings: RECORDINGS }),
      'charts,maps',
      INSTANT,
    );

    const events = await play(agent, input([user(PROMPT)]));

    expect(callsOf(events)).toEqual([{ name: 'messageWidget', args: { text: NOT_RECORDED_TEXT } }]);
  });
});

import { EventType, type BaseEvent, type RunAgentInput } from '@ag-ui/core';
import { lastValueFrom, toArray } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { paceRun, type ReplayPace } from './paced-run';
import { emptyRun, toolCallRun } from './scripted-run';

const INPUT: RunAgentInput = {
  threadId: 'thread',
  runId: 'run-1',
  messages: [],
  tools: [],
  context: [],
  state: {},
};
const INSTANT: ReplayPace = { thinkMs: 0, chunkMs: 0, chunkChars: Number.MAX_SAFE_INTEGER };
const ARGS = { messages: [{ version: 'v0.9', createSurface: { surfaceId: 'upcoming' } }] };

function play(events: readonly BaseEvent[], pace: ReplayPace): Promise<BaseEvent[]> {
  return lastValueFrom(paceRun(events, pace, INPUT.runId).pipe(toArray()));
}

function types(events: BaseEvent[]): EventType[] {
  return events.map((event) => event.type);
}

function deltas(events: BaseEvent[]): string[] {
  return events
    .filter((event) => event.type === EventType.TOOL_CALL_ARGS)
    .map((event) => (event as BaseEvent & { delta: string }).delta);
}

describe('paceRun', () => {
  it('fills the pause before the first tool call with a reasoning message of the run', async () => {
    const events = await play(toolCallRun(INPUT, 'findConferences', { topic: 'angular' }), INSTANT);

    expect(types(events)).toEqual([
      EventType.RUN_STARTED,
      EventType.REASONING_START,
      EventType.REASONING_MESSAGE_START,
      EventType.REASONING_MESSAGE_END,
      EventType.REASONING_END,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.RUN_FINISHED,
    ]);
    expect(events[1]).toMatchObject({ messageId: 'reasoning-run-1' });
    expect(events[2]).toMatchObject({ messageId: 'reasoning-run-1', role: 'reasoning' });
  });

  it('streams the arguments in chunks that reassemble to the recorded JSON', async () => {
    const script = toolCallRun(INPUT, 'renderSurface', ARGS);
    const json = JSON.stringify(ARGS);

    const events = await play(script, { thinkMs: 0, chunkMs: 0, chunkChars: 16 });

    expect(deltas(events)).toHaveLength(Math.ceil(json.length / 16));
    expect(deltas(events).join('')).toBe(json);
    expect(deltas(await play(script, INSTANT))).toEqual([json]);
  });

  it('an empty run still thinks, so a run beyond the recording looks like a model that answered nothing', async () => {
    const events = await play(emptyRun(INPUT), INSTANT);

    expect(types(events)).toEqual([
      EventType.RUN_STARTED,
      EventType.REASONING_START,
      EventType.REASONING_MESSAGE_START,
      EventType.REASONING_MESSAGE_END,
      EventType.REASONING_END,
      EventType.RUN_FINISHED,
    ]);
  });

  it('waits the thinking pause and the chunk pauses, as a model round trip would', async () => {
    const script = toolCallRun(INPUT, 'renderSurface', ARGS);
    const chunkCount = Math.ceil(JSON.stringify(ARGS).length / 16);
    const started = performance.now();

    await play(script, { thinkMs: 40, chunkMs: 5, chunkChars: 16 });

    expect(performance.now() - started).toBeGreaterThanOrEqual(40 + chunkCount * 5 - 5);
  });
});

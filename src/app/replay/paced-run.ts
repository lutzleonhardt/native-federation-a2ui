import {
  EventType,
  type BaseEvent,
  type ReasoningEndEvent,
  type ReasoningMessageEndEvent,
  type ReasoningMessageStartEvent,
  type ReasoningStartEvent,
  type ToolCallArgsEvent,
} from '@ag-ui/core';
import { concatMap, from, map, of, timer, type Observable } from 'rxjs';

/** How a replayed run is paced: the shape of a model round trip, compressed. */
export interface ReplayPace {
  /** The pause before the first tool call; the chat shows it as "Thinking…". */
  readonly thinkMs: number;
  /** Between two argument chunks; `renderSurface` shows "Building surface …" meanwhile. */
  readonly chunkMs: number;
  /** Characters per argument chunk. */
  readonly chunkChars: number;
}

/** About a fifth of the live agent (measured: ~5 s of reasoning, a 20-character delta every 45 ms). */
export const REPLAY_PACE: ReplayPace = { thinkMs: 900, chunkMs: 30, chunkChars: 64 };

interface Step {
  readonly afterMs: number;
  readonly event: BaseEvent;
}

/**
 * Streams an instant run script the way the live agent arrives: a reasoning message fills
 * the pause between `RUN_STARTED` and the first tool call, and every tool call's arguments
 * come in chunks. The script's first event must be `RUN_STARTED`.
 */
export function paceRun(
  events: readonly BaseEvent[],
  pace: ReplayPace,
  runId: string,
): Observable<BaseEvent> {
  const steps = events.flatMap((event, index) => toSteps(event, index, pace, `reasoning-${runId}`));
  return from(steps).pipe(
    concatMap((step) =>
      step.afterMs > 0 ? timer(step.afterMs).pipe(map(() => step.event)) : of(step.event),
    ),
  );
}

function toSteps(event: BaseEvent, index: number, pace: ReplayPace, messageId: string): Step[] {
  if (index === 0) return [{ afterMs: 0, event }, ...reasoningStart(messageId)];
  const steps: Step[] = index === 1 ? reasoningEnd(messageId, pace.thinkMs) : [];
  if (event.type === EventType.TOOL_CALL_ARGS) {
    const args = event as ToolCallArgsEvent;
    for (const delta of chunks(args.delta, pace.chunkChars)) {
      steps.push({ afterMs: pace.chunkMs, event: { ...args, delta } });
    }
    return steps;
  }
  steps.push({ afterMs: 0, event });
  return steps;
}

function reasoningStart(messageId: string): Step[] {
  const start: ReasoningStartEvent = { type: EventType.REASONING_START, messageId };
  const message: ReasoningMessageStartEvent = {
    type: EventType.REASONING_MESSAGE_START,
    messageId,
    role: 'reasoning',
  };
  return [
    { afterMs: 0, event: start },
    { afterMs: 0, event: message },
  ];
}

function reasoningEnd(messageId: string, thinkMs: number): Step[] {
  const message: ReasoningMessageEndEvent = { type: EventType.REASONING_MESSAGE_END, messageId };
  const end: ReasoningEndEvent = { type: EventType.REASONING_END, messageId };
  return [
    { afterMs: thinkMs, event: message },
    { afterMs: 0, event: end },
  ];
}

function chunks(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const parts: string[] = [];
  for (let start = 0; start < text.length; start += size) {
    parts.push(text.slice(start, start + size));
  }
  return parts;
}

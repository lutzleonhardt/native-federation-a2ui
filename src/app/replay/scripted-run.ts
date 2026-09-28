import {
  EventType,
  type BaseEvent,
  type RunAgentInput,
  type RunFinishedEvent,
  type RunStartedEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallStartEvent,
} from '@ag-ui/core';

/** One tool call of a scripted run; the id defaults to name, run and position. */
export interface ScriptedToolCall {
  readonly name: string;
  readonly args: unknown;
  readonly toolCallId?: string;
}

/**
 * The AG-UI events of a run whose tool calls are known up front — the replay
 * agent's output and the test seam's. `RUN_STARTED`/`RUN_FINISHED` must echo the
 * input's thread and run ids, and every tool call id must be unique across the
 * transcript, which the run id guarantees.
 */
export function emptyRun(input: RunAgentInput): BaseEvent[] {
  return [runStarted(input), runFinished(input)];
}

/** One assistant message carrying a single tool call with fully streamed arguments. */
export function toolCallRun(
  input: RunAgentInput,
  name: string,
  args: unknown,
  toolCallId?: string,
): BaseEvent[] {
  return toolCallsRun(input, [{ name, args, toolCallId }]);
}

/** One assistant message carrying several tool calls, streamed one after the other. */
export function toolCallsRun(
  input: RunAgentInput,
  calls: readonly ScriptedToolCall[],
): BaseEvent[] {
  const parentMessageId = `message-${input.runId}`;
  const events = calls.flatMap((call, index) => {
    const toolCallId = call.toolCallId ?? `${call.name}-${input.runId}-${index}`;
    const start: ToolCallStartEvent = {
      type: EventType.TOOL_CALL_START,
      toolCallId,
      toolCallName: call.name,
      parentMessageId,
    };
    const args: ToolCallArgsEvent = {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta: JSON.stringify(call.args),
    };
    const end: ToolCallEndEvent = { type: EventType.TOOL_CALL_END, toolCallId };
    return [start, args, end];
  });
  return [runStarted(input), ...events, runFinished(input)];
}

function runStarted({ threadId, runId }: RunAgentInput): RunStartedEvent {
  return { type: EventType.RUN_STARTED, threadId, runId };
}

function runFinished({ threadId, runId }: RunAgentInput): RunFinishedEvent {
  return { type: EventType.RUN_FINISHED, threadId, runId };
}

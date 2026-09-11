import { AbstractAgent } from '@ag-ui/client';
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
import { from, type Observable, type ObservableInput } from 'rxjs';

/** Chooses the events of one run; `runIndex` counts the runs this agent has seen. */
export type MockRunScript = (input: RunAgentInput, runIndex: number) => ObservableInput<BaseEvent>;

/**
 * Scripted AG-UI agent: the test seam behind `ASSISTANT_AGENT`. Every run's
 * input is kept so tests can assert what the shell would have sent.
 */
export class MockAgent extends AbstractAgent {
  readonly inputs: RunAgentInput[] = [];

  constructor(private readonly script: MockRunScript) {
    super({ agentId: 'assistant' });
  }

  override run(input: RunAgentInput): Observable<BaseEvent> {
    const runIndex = this.inputs.push(input) - 1;
    return from(this.script(input, runIndex));
  }
}

export interface ScriptedToolCall {
  readonly name: string;
  readonly args: unknown;
  readonly toolCallId?: string;
}

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
export function toolCallsRun(input: RunAgentInput, calls: readonly ScriptedToolCall[]): BaseEvent[] {
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

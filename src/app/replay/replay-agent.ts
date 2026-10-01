import { AbstractAgent } from '@ag-ui/client';
import type { BaseEvent, Message, RunAgentInput } from '@ag-ui/core';
import type { Observable } from 'rxjs';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import { record, SURFACE_MESSAGE_KEYS } from '../a2ui/surface-host-rules';
import { paceRun, REPLAY_PACE, type ReplayPace } from './paced-run';
import { findRecording, type RecordedCall, type Recordings } from './recordings';
import { emptyRun, toolCallRun, toolCallsRun, type ScriptedToolCall } from './scripted-run';

/** The answer to any prompt the file does not hold: free text, or a set without recordings. */
export const NOT_RECORDED_TEXT =
  'This question has no recorded answer. The hosted demo plays back recordings of the example ' +
  'prompts above, one per prompt and capability set. For a live model, clone the ' +
  '[repository](https://github.com/lutzleonhardt/native-federation-a2ui#readme), add one provider ' +
  'key to `.env` and run `npm start`.';

/**
 * Plays recorded tool calls instead of asking a model. A run looks at two things only: the
 * capability set this shell loaded and the last user message — the transcript before it is
 * ignored, because every prompt was recorded as the first message of a fresh conversation.
 * The run index within a turn is the count of assistant messages since that user message:
 * CopilotKit runs the agent again after a `followUp` tool, and the recording holds one run
 * per such round. The events are known at once and streamed at the live agent's pace.
 */
export class ReplayAgent extends AbstractAgent {
  constructor(
    private readonly recordings: Recordings,
    private readonly setKey: string,
    private readonly pace: ReplayPace = REPLAY_PACE,
  ) {
    super({ agentId: ASSISTANT_AGENT_ID });
  }

  override run(input: RunAgentInput): Observable<BaseEvent> {
    return paceRun(this.eventsOf(input), this.pace, input.runId);
  }

  private eventsOf(input: RunAgentInput): BaseEvent[] {
    const turn = currentTurn(input.messages);
    const runs =
      turn.prompt === undefined
        ? undefined
        : findRecording(this.recordings, this.setKey, turn.prompt);
    if (runs === undefined) {
      return toolCallRun(input, 'messageWidget', { text: NOT_RECORDED_TEXT });
    }
    const run = runs[turn.runIndex];
    if (run === undefined) return emptyRun(input);
    return toolCallsRun(
      input,
      run.map((call) => forPlayback(call, input.runId)),
    );
  }
}

/** The last user message's text and how many assistant messages followed it. */
function currentTurn(messages: readonly Message[]): {
  readonly prompt: string | undefined;
  readonly runIndex: number;
} {
  let runIndex = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'user') {
      const prompt = typeof message.content === 'string' ? message.content : undefined;
      return { prompt, runIndex };
    }
    if (message.role === 'assistant') runIndex += 1;
  }
  return { prompt: undefined, runIndex };
}

/**
 * A recorded `renderSurface` names the surfaces of its capture; the shell refuses an id it
 * has already seen, and a second click plays the same recording — so every playback
 * suffixes its surface ids with the run id. Other calls play back verbatim.
 */
function forPlayback(call: RecordedCall, runId: string): ScriptedToolCall {
  const args = record(call.args);
  const messages = args?.['messages'];
  if (call.name !== 'renderSurface' || !Array.isArray(messages)) return call;
  return {
    name: call.name,
    args: { ...args, messages: messages.map((message) => withSurfaceSuffix(message, runId)) },
  };
}

function withSurfaceSuffix(message: unknown, suffix: string): unknown {
  const body = record(message);
  if (body === undefined) return message;
  for (const key of SURFACE_MESSAGE_KEYS) {
    const form = record(body[key]);
    if (form === undefined || typeof form['surfaceId'] !== 'string') continue;
    return { ...body, [key]: { ...form, surfaceId: `${form['surfaceId']}-${suffix}` } };
  }
  return message;
}

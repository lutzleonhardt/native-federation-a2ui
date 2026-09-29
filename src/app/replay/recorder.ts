import { InjectionToken, type DestroyRef } from '@angular/core';
import type { AbstractAgent } from '@ag-ui/client';
import type { AssistantMessage, Message } from '@ag-ui/core';
import { record } from '../a2ui/surface-host-rules';
import {
  capturedCity,
  parseRecordings,
  RECORDINGS_A2UI,
  RECORDINGS_FORMAT,
  type RecordedCall,
  type RecordedRun,
  type Recordings,
} from './recordings';

/** Attaches the recorder to the live agent for the lifetime of the injector. */
export type RunRecorder = (agent: AbstractAgent, destroyRef: DestroyRef) => void;

/** The recorder to attach, or undefined: only the local agent asked with `?record` records. */
export const RUN_RECORDER = new InjectionToken<RunRecorder | undefined>('RUN_RECORDER', {
  factory: () => undefined,
});

/** `public/recordings.json` as the recorder writes it; `parseRecordings` reads three of the keys. */
export interface RecordingsFile {
  readonly format: typeof RECORDINGS_FORMAT;
  readonly a2ui: typeof RECORDINGS_A2UI;
  readonly capturedAt: string;
  /** The picker id every cell was captured in; replay pins the location to it. */
  readonly city: string;
  readonly note: string;
  readonly recordings: Recordings;
}

/** One prompt's recorded answer: the accepted runs since the last user message. */
export interface RecordedTurn {
  readonly prompt: string;
  readonly runs: readonly RecordedRun[];
}

export const RECORDINGS_STORAGE_KEY = 'conference-finder.recordings';

const NOTE =
  'Captured in the browser with ?record. Re-record after any change to a prompt text, a ' +
  'component or function description, the agent prompt or the manifest remotes.';

/**
 * The counterpart of `ReplayAgent`, dev-only. Nothing is counted: whenever the transcript
 * changes while the agent is idle, the current turn is derived from it and its cell
 * (`setKey` × prompt) replaces the one in the stored file — the other cells stay, and a
 * re-click replaces only its own. The file lives in `storage` so the reload of a set switch
 * keeps it, and every write logs the whole file: the last entry is the file to paste. The
 * shell notifies once more after the turn-ending tool result (`publishToolResults`), so the
 * last write of a turn is complete.
 */
export function recorderFor(
  setKey: string,
  cityId: () => string | undefined,
  storage: Storage = localStorage,
): RunRecorder {
  return (agent, destroyRef) => {
    let lastWritten = '';
    const subscription = agent.subscribe({
      onMessagesChanged: ({ messages }) => {
        if (agent.isRunning) return;
        const turn = recordedTurn(messages);
        if (turn === undefined) return;
        const cell = JSON.stringify(turn);
        if (cell === lastWritten) return;
        const file = fileFor(storage, cityId());
        if (file === undefined) return;
        lastWritten = cell;
        const text = JSON.stringify(withCell(file, setKey, turn), null, 2);
        storage.setItem(RECORDINGS_STORAGE_KEY, text);
        console.log(text);
      },
    });
    destroyRef.onDestroy(() => subscription.unsubscribe());
  };
}

/**
 * The last user message and the runs after it that replay can play: one run per assistant
 * message with tool calls, kept only when every call's tool result was `ok` — a refused
 * `renderSurface` never replays, the shell has no model for its correction. A turn whose
 * last such run was refused has no answer yet (the correction is pending, or the shell gave
 * up) and is undefined, so a failed click never replaces a good cell.
 */
export function recordedTurn(messages: readonly Message[]): RecordedTurn | undefined {
  const start = lastUserIndex(messages);
  if (start === -1) return undefined;
  const prompt = messages[start].content;
  if (typeof prompt !== 'string') return undefined;
  const turn = messages.slice(start + 1);
  const accepted = new Set<string>();
  for (const message of turn) {
    if (message.role === 'tool' && isOk(message.content)) accepted.add(message.toolCallId);
  }
  const runs: RecordedRun[] = [];
  let lastAccepted = false;
  for (const message of turn) {
    if (message.role !== 'assistant' || (message.toolCalls ?? []).length === 0) continue;
    const run = acceptedRun(message, accepted);
    lastAccepted = run !== undefined;
    if (run !== undefined) runs.push(run);
  }
  return lastAccepted ? { prompt, runs } : undefined;
}

function lastUserIndex(messages: readonly Message[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return index;
  }
  return -1;
}

/** The message's calls as one run, or undefined when a call was refused or unparsable. */
function acceptedRun(
  message: AssistantMessage,
  accepted: ReadonlySet<string>,
): RecordedRun | undefined {
  const run: RecordedCall[] = [];
  for (const call of message.toolCalls ?? []) {
    const args = parsedArgs(call.function.arguments);
    if (!accepted.has(call.id) || args === undefined) return undefined;
    run.push({ name: call.function.name, args });
  }
  return run;
}

/** Every tool result of the shell carries `ok` (`ToolResult`); anything else is not accepted. */
function isOk(content: string): boolean {
  try {
    return record(JSON.parse(content))?.['ok'] === true;
  } catch {
    return false;
  }
}

function parsedArgs(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * The file the cell goes into: the stored one continued, or a fresh one. Every cell of a
 * file is captured in one city, so a page without a city, or in another city than the
 * stored file, writes nothing and says why.
 */
function fileFor(storage: Storage, city: string | undefined): RecordingsFile | undefined {
  if (city === undefined) {
    console.warn(
      '[recorder] no city picked; the turn was not written — pick a city and click again',
    );
    return undefined;
  }
  const stored = storedFile(storage);
  if (stored !== undefined && stored.city !== city) {
    console.warn(
      `[recorder] the stored file was captured in "${stored.city}", this page is in "${city}"; ` +
        `the turn was not written — remove localStorage["${RECORDINGS_STORAGE_KEY}"] to start over`,
    );
    return undefined;
  }
  return {
    format: RECORDINGS_FORMAT,
    a2ui: RECORDINGS_A2UI,
    capturedAt: new Date().toISOString().slice(0, 10),
    city,
    note: NOTE,
    recordings: stored?.recordings ?? {},
  };
}

/** What continues across writes; a missing store or one without a city starts over. */
interface StoredFile {
  readonly city: string;
  readonly recordings: Recordings;
}

/** The stored file, read like the served one. */
function storedFile(storage: Storage): StoredFile | undefined {
  const stored = storage.getItem(RECORDINGS_STORAGE_KEY);
  if (stored === null) return undefined;
  try {
    const json: unknown = JSON.parse(stored);
    const city = capturedCity(json);
    return city === undefined ? undefined : { city, recordings: parseRecordings(json) };
  } catch {
    return undefined;
  }
}

function withCell(file: RecordingsFile, setKey: string, turn: RecordedTurn): RecordingsFile {
  const prompts = { ...file.recordings[setKey], [turn.prompt]: turn.runs };
  return { ...file, recordings: { ...file.recordings, [setKey]: prompts } };
}

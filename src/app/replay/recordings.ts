import { record } from '../a2ui/surface-host-rules';
import { findCity } from '../domain/cities';

/**
 * Pins of `public/recordings.json`. The vocabulary is deliberately unversioned; a
 * recording is bound to the A2UI envelope it was captured against, so the file
 * names that version, its own layout and the city of the capture (`capturedCity`),
 * and a file with other values is refused.
 */
export const RECORDINGS_FORMAT = 1;
export const RECORDINGS_A2UI = 'v0.9';

/** One tool call the model made: name and parsed arguments, structure only — no data, no ids. */
export interface RecordedCall {
  readonly name: string;
  readonly args: unknown;
}

/** One run of the model, i.e. one assistant message worth of tool calls. */
export type RecordedRun = readonly RecordedCall[];

/** Capability set key (`capabilitySetKey`) → prompt text → the runs of that answer. */
export type Recordings = Readonly<Record<string, Readonly<Record<string, readonly RecordedRun[]>>>>;

/** What replay works with when the file is missing or refused: every prompt is not recorded. */
export const NO_RECORDINGS: Recordings = {};

/** The set as the URL spells it: the loaded remotes in manifest order, `,`-joined, empty for none. */
export function capabilitySetKey(loadedNames: readonly string[]): string {
  return loadedNames.join(',');
}

/**
 * Parses the JSON of the fetched file. Other pins or a malformed body refuse it whole
 * with a console message, so replay answers every prompt as not recorded instead of
 * failing at the first click.
 */
export function parseRecordings(json: unknown): Recordings {
  const body = record(json);
  if (body === undefined) return refuse('not an object');
  if (body['format'] !== RECORDINGS_FORMAT || body['a2ui'] !== RECORDINGS_A2UI) {
    return refuse(
      `expected format ${RECORDINGS_FORMAT} and a2ui ${RECORDINGS_A2UI}, got format ${String(body['format'])} and a2ui ${String(body['a2ui'])}`,
    );
  }
  if (capturedCity(json) === undefined) {
    return refuse(`"city" is not a city the picker offers, got ${String(body['city'])}`);
  }
  const sets = record(body['recordings']);
  if (sets === undefined) return refuse('"recordings" is not an object');
  for (const [setKey, prompts] of Object.entries(sets)) {
    const flaw = setFlaw(setKey, prompts);
    if (flaw !== undefined) return refuse(flaw);
  }
  return sets as Recordings;
}

/**
 * The picker id every cell was captured in. Replay pins the location to it, so a radius the
 * model chose and a conference it named stay true; undefined when the body names no city
 * the picker offers.
 */
export function capturedCity(json: unknown): string | undefined {
  const city = record(json)?.['city'];
  return typeof city === 'string' && findCity(city) !== undefined ? city : undefined;
}

/** Why one capability set's entry is unusable, or undefined when it is prompts of runs of calls. */
function setFlaw(setKey: string, prompts: unknown): string | undefined {
  const byPrompt = record(prompts);
  if (byPrompt === undefined) return `set "${setKey}" is not an object`;
  const bad = Object.entries(byPrompt).find(([, runs]) => !isRuns(runs));
  return bad === undefined ? undefined : `set "${setKey}", prompt "${bad[0]}": not a list of runs`;
}

/** The runs recorded for this set and prompt; whitespace around a typed prompt does not count. */
export function findRecording(
  recordings: Recordings,
  setKey: string,
  prompt: string,
): readonly RecordedRun[] | undefined {
  const byPrompt = own(recordings, setKey);
  return byPrompt === undefined ? undefined : own(byPrompt, prompt.trim());
}

/** Own keys only: a typed `constructor` or `__proto__` must not find `Object.prototype`. */
function own<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

function isRuns(value: unknown): value is readonly RecordedRun[] {
  return Array.isArray(value) && value.every((run) => Array.isArray(run) && run.every(isCall));
}

function isCall(value: unknown): value is RecordedCall {
  const call = record(value);
  return call !== undefined && typeof call['name'] === 'string' && 'args' in call;
}

function refuse(reason: string): Recordings {
  console.error(
    `[replay] recordings.json refused (${reason}); every prompt answers as not recorded`,
  );
  return NO_RECORDINGS;
}

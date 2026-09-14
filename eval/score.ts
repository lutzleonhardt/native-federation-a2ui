import {
  findForbiddenModelWrites,
  findStructuralViolations,
  isRecord,
  record,
} from '../src/app/a2ui/surface-host-rules';

/**
 * Scores what the model actually emitted, not what it should have said. The
 * checks encode the M1 risk: is the interaction wired inside one surface with
 * bindings, or built from literals and copied data?
 *
 * Anything the shell's `renderSurface` boundary rejects must fail here too, so
 * the host rules come from the module the shell itself uses — they were copied
 * once and drifted, which let forbidden writes and malformed surfaces score as
 * success.
 *
 * Pure on purpose — `run-eval.ts` does the I/O, this file is unit-tested.
 */

/** One recorded `renderSurface` tool call: the raw arguments the model produced. */
export type RecordedCall = { readonly messages?: readonly unknown[] };

export type Requirement = 'A1' | 'A2' | 'A3';

export interface Verdict {
  readonly passed: boolean;
  readonly reasons: readonly string[];
}

/** A date written into the data model freezes at recording time — the replay-freshness risk. */
const DATE_LITERAL = /\d{4}-\d{2}-\d{2}/;

/**
 * One answer is one surface. Everything below therefore judges a single message
 * list — without this guard the checks would flatten across surfaces and a run
 * could satisfy A3 by taking the Map from one and the Gauge from another.
 */
export function score(requirement: Requirement, calls: readonly RecordedCall[]): Verdict {
  if (calls.length !== 1) {
    return {
      passed: false,
      reasons: [`expected exactly one renderSurface call, got ${calls.length}`],
    };
  }

  const messages = calls[0].messages ?? [];
  const reasons = [...hostRuleFailures(messages), ...requirementFailures(requirement, messages)];
  return { passed: reasons.length === 0, reasons };
}

/** Exactly what the shell's `renderSurface` boundary rejects. */
function hostRuleFailures(messages: readonly unknown[]): string[] {
  const reasons = findStructuralViolations(messages).map((violation) => violation.message);
  for (const path of findForbiddenModelWrites(messages)) {
    reasons.push(`wrote client-owned path ${path} instead of binding it`);
  }
  for (const { path, value } of dataWrites(messages)) {
    if (DATE_LITERAL.test(JSON.stringify(value) ?? '')) {
      reasons.push(`wrote a date literal into the data model at ${path}`);
    }
  }
  return reasons;
}

function requirementFailures(requirement: Requirement, messages: readonly unknown[]): string[] {
  const parts = components(messages);
  switch (requirement) {
    case 'A1':
      return timelineFailures(parts);
    case 'A2':
      return mapFailures(parts);
    case 'A3':
      return detailFailures(parts, messages);
  }
}

function timelineFailures(parts: readonly Component[]): string[] {
  const timeline = byName(parts, 'Timeline');
  if (timeline === undefined) return ['no Timeline in the surface'];
  return boundTo(timeline['items'], '/filteredConfs')
    ? []
    : [`Timeline items is not bound to /filteredConfs (${describe(timeline['items'])})`];
}

function mapFailures(parts: readonly Component[]): string[] {
  const map = byName(parts, 'Map');
  if (map === undefined) return ['no Map in the surface'];
  const reasons: string[] = [];
  if (!boundTo(map['points'], '/filteredConfs')) {
    reasons.push(`Map points is not bound to /filteredConfs (${describe(map['points'])})`);
  }
  if (!boundTo(map['center'], '/me')) {
    reasons.push(`Map center is not bound to /me (${describe(map['center'])})`);
  }
  return reasons;
}

/**
 * The wiring proof: one selection path drives every detail view. `selected` names
 * that path, so the other checks are derived from it rather than hard-coded —
 * the model may pick a different name than `/selectedConf`.
 */
function detailFailures(parts: readonly Component[], messages: readonly unknown[]): string[] {
  const map = byName(parts, 'Map');
  if (map === undefined) return ['no Map in the surface'];

  const selection = pathOf(map['selected']);
  if (selection === undefined) {
    return [`Map selected is not bound to a path (${describe(map['selected'])}) — nothing is wired`];
  }

  const reasons: string[] = [];
  if (!parts.some((part) => part['component'] === 'Text' && boundTo(part['text'], `${selection}/name`))) {
    reasons.push(`no Text bound to ${selection}/name`);
  }
  const gauge = byName(parts, 'Gauge');
  if (gauge === undefined || !boundTo(gauge['value'], `${selection}/remaining`)) {
    reasons.push(`no Gauge bound to ${selection}/remaining`);
  }
  if (!hasReserveButton(parts, selection)) {
    reasons.push(`no Button dispatching reserve with id bound to ${selection}/id`);
  }
  for (const fn of ['daysUntil', 'distance']) {
    if (!usesFunction(messages, fn)) reasons.push(`${fn} not used in the surface`);
  }
  return reasons;
}

function hasReserveButton(parts: readonly Component[], selection: string): boolean {
  return parts.some((part) => {
    if (part['component'] !== 'Button') return false;
    const event = record(record(part['action'])?.['event']);
    if (event?.['name'] !== 'reserve') return false;
    return pathOf(record(event['context'])?.['id']) === `${selection}/id`;
  });
}

type Component = Record<string, unknown>;

function components(messages: readonly unknown[]): Component[] {
  return messages.filter(isRecord).flatMap((message) => {
    const update = record(message['updateComponents']);
    const list = update?.['components'];
    return Array.isArray(list) ? list.filter(isRecord) : [];
  });
}

function dataWrites(messages: readonly unknown[]): { path: string; value: unknown }[] {
  return messages.filter(isRecord).flatMap((message) => {
    const update = record(message['updateDataModel']);
    if (update === undefined) return [];
    return [{ path: typeof update['path'] === 'string' ? update['path'] : '/', value: update['value'] }];
  });
}

/** Matches the data model's own path handling: '/'-separated, empty segments dropped. */
function normalize(path: string): string {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return `/${segments.join('/')}`;
}

function pathOf(binding: unknown): string | undefined {
  const path = record(binding)?.['path'];
  return typeof path === 'string' ? normalize(path) : undefined;
}

function boundTo(binding: unknown, path: string): boolean {
  return pathOf(binding) === normalize(path);
}

/** A function binding is `{ call, args, returnType }` and may sit at any depth. */
function usesFunction(messages: readonly unknown[], name: string): boolean {
  const seen = (node: unknown): boolean => {
    if (Array.isArray(node)) return node.some(seen);
    if (!isRecord(node)) return false;
    if (node['call'] === name) return true;
    return Object.values(node).some(seen);
  };
  return seen(messages);
}

function byName(parts: readonly Component[], name: string): Component | undefined {
  return parts.find((part) => part['component'] === name);
}

function describe(binding: unknown): string {
  return binding === undefined ? 'absent' : JSON.stringify(binding);
}

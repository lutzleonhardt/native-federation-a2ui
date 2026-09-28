/**
 * The host rules an A2UI message list must satisfy beyond its schema: the
 * wrapper schema validates each message on its own, so everything that spans
 * messages lives here, together with the paths the client owns.
 *
 * Framework-free and shared on purpose. The shell enforces these rules at the
 * `renderSurface` boundary and the eval scorer judges recorded calls by them;
 * two copies drifted apart once already and let forbidden writes, missing and
 * duplicated `createSurface` messages score as success.
 *
 * Takes `unknown[]`: the scorer's input is raw model output, and the shell's
 * already-parsed messages are a subtype of that.
 */

/** First path segments the client mounts after the model's messages; the model only binds them. */
export const CLIENT_OWNED_SEGMENTS: ReadonlySet<string> = new Set([
  'filteredConfs',
  'selectedConf',
  'me',
  'byMonth',
  'byTopic',
]);

/** Where the client mounts the search result and the selection; components bind these names. */
export const LIST_PATH = '/filteredConfs';
export const SELECTION_PATH = '/selectedConf';

/** Shaped like the zod issues it is reported next to. */
export interface SurfaceViolation {
  readonly path: readonly (string | number)[];
  readonly message: string;
}

/**
 * Cross-message rules: exactly one fresh surface per call, no `deleteSurface`,
 * and every message addressing that one surface.
 */
export function findStructuralViolations(messages: readonly unknown[]): SurfaceViolation[] {
  const created = messages.filter((message) => has(message, 'createSurface'));
  if (created.length !== 1) {
    return [
      {
        path: ['messages'],
        message: `Expected exactly one createSurface message, got ${created.length}.`,
      },
    ];
  }

  const surfaceId = surfaceIdOf(created[0]);
  return messages.flatMap((message, index): SurfaceViolation[] => {
    if (has(message, 'deleteSurface')) {
      return [
        {
          path: ['messages', index],
          message: 'deleteSurface is not allowed; create a fresh surface instead.',
        },
      ];
    }
    return surfaceIdOf(message) === surfaceId
      ? []
      : [{ path: ['messages', index], message: `surfaceId mismatch: expected '${surfaceId}'.` }];
  });
}

/**
 * Returns the paths the model tried to write but must bind. Decides on parsed
 * segments, mirroring the data model's own path handling: 'me', '/me' and '/me/'
 * address the same location, and a root write ('', '/', or an absent path)
 * replaces every client-owned path at once — so it counts as forbidden whole.
 */
export function findForbiddenModelWrites(messages: readonly unknown[]): string[] {
  const paths: string[] = [];
  for (const message of messages) {
    const update = record(record(message)?.['updateDataModel']);
    if (update === undefined) continue;
    const path = typeof update['path'] === 'string' ? update['path'] : undefined;
    const segments = segmentsOf(path);
    if (segments.length === 0 || CLIENT_OWNED_SEGMENTS.has(segments[0])) {
      paths.push(path ?? '/');
    }
  }
  return paths;
}

/**
 * The selection has one home: a `selected` binding must point at {@link SELECTION_PATH} and a
 * `reserve` action's `id` context at its `id`, so the shell knows where a reservation lands.
 */
export function findSelectionPathViolations(messages: readonly unknown[]): SurfaceViolation[] {
  const violations: SurfaceViolation[] = [];
  messages.forEach((message, index) => {
    const components = record(record(message)?.['updateComponents'])?.['components'];
    if (!Array.isArray(components)) return;
    for (const component of components) {
      const part = record(component);
      if (part === undefined) continue;
      const selected = pathOf(part['selected']);
      if (selected !== undefined && !addresses(selected, SELECTION_PATH)) {
        violations.push({
          path: ['messages', index],
          message: `Component '${String(part['id'])}': bind selected to ${SELECTION_PATH}, not '${selected}'.`,
        });
      }
      const event = record(record(part['action'])?.['event']);
      if (event?.['name'] !== 'reserve') continue;
      const id = pathOf(record(event['context'])?.['id']);
      if (id === undefined || !addresses(id, `${SELECTION_PATH}/id`)) {
        violations.push({
          path: ['messages', index],
          message: `Component '${String(part['id'])}': the reserve context id must bind ${SELECTION_PATH}/id.`,
        });
      }
    }
  });
  return violations;
}

/**
 * Absolute only: inside a `List` template the renderer resolves a relative `selectedConf/id`
 * against the item's context (`/filteredConfs/0/selectedConf/id`), where nothing lives.
 * A trailing slash is tolerated, as the data model tolerates it.
 */
function addresses(path: string, expected: string): boolean {
  return path.startsWith('/') && segmentsOf(path).join('/') === segmentsOf(expected).join('/');
}

function pathOf(value: unknown): string | undefined {
  const path = record(value)?.['path'];
  return typeof path === 'string' ? path : undefined;
}

/**
 * Every function name the messages call, in order of first appearance. A call is a model
 * error wherever it names a function the catalog lacks — in a prop, nested in another
 * call's `args`, in an action context, or in a data value the renderer would never evaluate
 * — so the whole list is searched. The `JSON.parse` reviver is the walker: it visits every
 * key/value pair at every depth, and a function call is the pair `call: <string>`.
 */
export function findFunctionCalls(messages: readonly unknown[]): string[] {
  const names = new Set<string>();
  JSON.parse(JSON.stringify(messages), (key: string, value: unknown) => {
    if (key === 'call' && typeof value === 'string') names.add(value);
    return value;
  });
  return [...names];
}

/** Same splitting as the data model's `parsePath`: '/'-separated, empty segments dropped. */
export function segmentsOf(path: string | undefined): string[] {
  return (path ?? '').split('/').filter((segment) => segment.length > 0);
}

/** The message forms, each keyed by the surface it addresses. */
export const SURFACE_MESSAGE_KEYS = [
  'createSurface',
  'updateComponents',
  'updateDataModel',
  'deleteSurface',
] as const;

/** The surface a message addresses, whichever message form it is. */
export function surfaceIdOf(message: unknown): string | undefined {
  const body = record(message);
  if (body === undefined) return undefined;
  for (const key of SURFACE_MESSAGE_KEYS) {
    const id = record(body[key])?.['surfaceId'];
    if (typeof id === 'string') return id;
  }
  return undefined;
}

/** The one `createSurface` body, once {@link findStructuralViolations} reported none. */
export function createdSurface(
  messages: readonly unknown[],
): { readonly surfaceId: string; readonly catalogId: string } | undefined {
  for (const message of messages) {
    const created = record(record(message)?.['createSurface']);
    if (created === undefined) continue;
    const { surfaceId, catalogId } = created;
    if (typeof surfaceId === 'string' && typeof catalogId === 'string') {
      return { surfaceId, catalogId };
    }
  }
  return undefined;
}

function has(value: unknown, key: string): boolean {
  return record(value)?.[key] !== undefined;
}

/**
 * Narrowing raw model output is part of this module's job — both it and the eval
 * scorer walk JSON that no type system has seen yet, so the two live here rather
 * than once per reader.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function record(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

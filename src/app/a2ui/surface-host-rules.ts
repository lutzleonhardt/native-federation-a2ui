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
  'me',
  'byMonth',
  'byTopic',
]);

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

/** The surface a message addresses, whichever message form it is. */
export function surfaceIdOf(message: unknown): string | undefined {
  const body = record(message);
  if (body === undefined) return undefined;
  for (const key of ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface']) {
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

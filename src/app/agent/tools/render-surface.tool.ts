import { inject } from '@angular/core';
import { A2UI_RENDERER_CONFIG, A2uiRendererService, type AngularCatalog } from '@a2ui/angular/v0_9';
import { A2uiMessageListWrapperSchema, type A2uiMessage } from '@a2ui/web_core/v0_9';
import type { FrontendToolSpec, ToolResult } from '../create-frontend-tool';
import { RENDER_FAILURE_HANDLER } from '../render-failure-handler.token';
import { SurfaceDataStore } from '../surface-data.store';
import { renderSurfaceDefinition, type RenderSurfaceArgs } from './render-surface.definition';
import { SurfaceToolRendererComponent } from './surface-tool-renderer.component';

/** First path segments mounted by the client after the model's messages; the model only binds them. */
const CLIENT_OWNED_SEGMENTS = new Set(['filteredConfs', 'me', 'byMonth', 'byTopic']);

export interface RenderSurfaceToolResult extends ToolResult {
  readonly ok: true;
  readonly surfaceId: string;
}

export const renderSurfaceTool: FrontendToolSpec<RenderSurfaceArgs> = {
  ...renderSurfaceDefinition,
  followUp: false,
  component: SurfaceToolRendererComponent,
  handler: async (args, context): Promise<ToolResult> => {
    const renderer = inject(A2uiRendererService);
    const store = inject(SurfaceDataStore);
    const onFailure = inject(RENDER_FAILURE_HANDLER);
    const fail = (code: string, result: unknown): ToolResult => {
      onFailure({ toolCallId: context.toolCall.id, code, issues: result });
      return { ok: false, code, result };
    };

    const parsed = A2uiMessageListWrapperSchema.safeParse(args);
    if (!parsed.success) return fail('invalid_messages', parsed.error.issues);
    const messages = parsed.data.messages;

    const surface = resolveSurfaceId(messages);
    if ('issues' in surface) return fail('invalid_messages', surface.issues);
    if (renderer.surfaceGroup.getSurface(surface.id) !== undefined) {
      return fail('invalid_messages', [
        {
          path: ['messages'],
          message: `Surface '${surface.id}' already exists; use a fresh surfaceId.`,
        },
      ]);
    }

    const forbiddenModelWrites = findForbiddenModelWrites(messages);
    if (forbiddenModelWrites.length > 0) {
      return fail(
        'forbidden_model_writes',
        `Bind these paths instead of writing them; the client mounts their values: ${forbiddenModelWrites.join(', ')}.`,
      );
    }

    const catalogs = inject(A2UI_RENDERER_CONFIG).catalogs ?? [];
    const unknown = findUnknownComponents(messages, catalogs, surface.catalogId);
    if (unknown.length > 0) {
      return fail('catalog', `Unknown component(s): ${unknown.join(', ')}.`);
    }

    try {
      renderer.processMessages(messages);
      renderer.processMessages(
        createClientDataMessages(surface.id, store, writesFirstSegment(messages, 'selectedConf')),
      );
    } catch (error) {
      // Messages apply one by one, so a failure can leave the surface of an
      // already-applied createSurface (or a half-mounted data model) behind —
      // take it back out. The fresh-id check above guarantees it is ours.
      deleteSurface(renderer, surface.id);
      return fail('catalog', error instanceof Error ? error.message : String(error));
    }

    const success: RenderSurfaceToolResult = { ok: true, surfaceId: surface.id };
    return success;
  },
  onValidationFailure: (context, issues) => {
    // followUp is static, so even a boundary rejection must reach the
    // correction channel — otherwise the turn ends without any signal.
    inject(RENDER_FAILURE_HANDLER)({ toolCallId: context.toolCall.id, code: 'invalid_args', issues });
  },
};

interface SurfaceIssue {
  readonly path: readonly (string | number)[];
  readonly message: string;
}

/**
 * The wrapper schema validates each message alone; one fresh surface per call
 * is the protocol contract, so the cross-message check lives here — issues are
 * shaped like the zod issues they sit next to.
 */
function resolveSurfaceId(
  messages: readonly A2uiMessage[],
): { readonly id: string; readonly catalogId: string } | { readonly issues: readonly SurfaceIssue[] } {
  const created = messages.flatMap((message) =>
    'createSurface' in message ? [message.createSurface] : [],
  );
  if (created.length !== 1) {
    return { issues: [{ path: ['messages'], message: 'Expected exactly one createSurface message.' }] };
  }

  const { surfaceId: id, catalogId } = created[0];
  const issues = messages.flatMap((message, index): SurfaceIssue[] => {
    if ('deleteSurface' in message) {
      return [
        {
          path: ['messages', index],
          message: 'deleteSurface is not allowed; create a fresh surface instead.',
        },
      ];
    }
    return surfaceIdOf(message) === id
      ? []
      : [{ path: ['messages', index], message: `surfaceId mismatch: expected '${id}'.` }];
  });
  return issues.length === 0 ? { id, catalogId } : { issues };
}

function surfaceIdOf(message: A2uiMessage): string {
  if ('createSurface' in message) return message.createSurface.surfaceId;
  if ('updateComponents' in message) return message.updateComponents.surfaceId;
  if ('updateDataModel' in message) return message.updateDataModel.surfaceId;
  return message.deleteSurface.surfaceId;
}

/**
 * The processor validates props only for names the catalog knows and skips the
 * rest silently — an unknown name would reach the screen as a blank spot, so
 * it is rejected here instead. An unknown catalog id stays with the processor,
 * which throws for it.
 */
function findUnknownComponents(
  messages: readonly A2uiMessage[],
  catalogs: readonly AngularCatalog[],
  catalogId: string,
): string[] {
  const catalog = catalogs.find((candidate) => candidate.id === catalogId);
  if (catalog === undefined) return [];

  const unknown = new Set<string>();
  for (const message of messages) {
    if (!('updateComponents' in message)) continue;
    for (const component of message.updateComponents.components) {
      const name = (component as { component?: unknown }).component;
      if (typeof name === 'string' && !catalog.components.has(name)) unknown.add(name);
    }
  }
  return [...unknown];
}

/**
 * Decides on parsed segments, mirroring the data model's own path handling:
 * 'me', '/me' and '/me/' address the same location, and a root write ('',
 * '/', or an absent path) replaces every client-owned path at once — so it
 * counts as forbidden as a whole.
 */
function findForbiddenModelWrites(messages: readonly A2uiMessage[]): string[] {
  const paths: string[] = [];
  for (const message of messages) {
    if (!('updateDataModel' in message)) continue;
    const { path } = message.updateDataModel;
    const segments = segmentsOf(path);
    if (segments.length === 0 || CLIENT_OWNED_SEGMENTS.has(segments[0])) {
      paths.push(path ?? '/');
    }
  }
  return paths;
}

function writesFirstSegment(messages: readonly A2uiMessage[], segment: string): boolean {
  return messages.some(
    (message) =>
      'updateDataModel' in message && segmentsOf(message.updateDataModel.path)[0] === segment,
  );
}

/** Same splitting as the data model's `parsePath`: '/'-separated, empty segments dropped. */
function segmentsOf(path: string | undefined): string[] {
  return (path ?? '').split('/').filter((segment) => segment.length > 0);
}

function createClientDataMessages(
  surfaceId: string,
  store: SurfaceDataStore,
  modelWroteSelectedConf: boolean,
): A2uiMessage[] {
  const set = (path: string, value: unknown): A2uiMessage => ({
    version: 'v0.9',
    updateDataModel: { surfaceId, path, value },
  });

  const confs = store.confs();
  const messages = [set('/filteredConfs', [...confs])];
  const me = store.me();
  if (me !== undefined) messages.push(set('/me', me));
  const byMonth = store.byMonth();
  if (byMonth !== undefined) messages.push(set('/byMonth', [...byMonth]));
  const byTopic = store.byTopic();
  if (byTopic !== undefined) messages.push(set('/byTopic', [...byTopic]));
  if (!modelWroteSelectedConf && confs.length > 0) messages.push(set('/selectedConf', confs[0]));
  return messages;
}

function deleteSurface(renderer: A2uiRendererService, surfaceId: string): void {
  if (renderer.surfaceGroup.getSurface(surfaceId) === undefined) return;
  renderer.processMessages([{ version: 'v0.9', deleteSurface: { surfaceId } }]);
}

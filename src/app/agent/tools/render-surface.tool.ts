import { inject } from '@angular/core';
import { A2UI_RENDERER_CONFIG, A2uiRendererService, type AngularCatalog } from '@a2ui/angular/v0_9';
import { A2uiMessageListWrapperSchema, type A2uiMessage } from '@a2ui/web_core/v0_9';
import {
  createdSurface,
  findForbiddenModelWrites,
  findFunctionCalls,
  findSelectionPathViolations,
  findStructuralViolations,
  LIST_PATH,
  SELECTION_PATH,
} from '../../a2ui/surface-host-rules';
import type { FrontendToolSpec, ToolResult } from '../create-frontend-tool';
import { RENDER_FAILURE_HANDLER } from '../render-failure-handler.token';
import { SurfaceDataStore } from '../surface-data.store';
import { renderSurfaceDefinition, type RenderSurfaceArgs } from './render-surface.definition';
import { SurfaceToolRendererComponent } from './surface-tool-renderer.component';

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
    const catalogs = inject(A2UI_RENDERER_CONFIG).catalogs ?? [];
    const fail = (code: string, result: unknown): ToolResult => {
      onFailure({ toolCallId: context.toolCall.id, code, issues: result });
      return { ok: false, code, result };
    };

    const request = validateRenderRequest(args, renderer, catalogs);
    if (!request.ok) return fail(request.code, request.result);
    const { messages, surface } = request;

    try {
      renderer.processMessages(messages);
      renderer.processMessages(createClientDataMessages(surface.surfaceId, store));
    } catch (error) {
      // Messages apply one by one, so a failure can leave the surface of an
      // already-applied createSurface (or a half-mounted data model) behind —
      // take it back out. The fresh-id check in validateRenderRequest guarantees it is ours.
      deleteSurface(renderer, surface.surfaceId);
      return fail('catalog', error instanceof Error ? error.message : String(error));
    }

    const success: RenderSurfaceToolResult = { ok: true, surfaceId: surface.surfaceId };
    return success;
  },
  onValidationFailure: (context, issues) => {
    // followUp is static, so even a boundary rejection must reach the
    // correction channel — otherwise the turn ends without any signal.
    inject(RENDER_FAILURE_HANDLER)({
      toolCallId: context.toolCall.id,
      code: 'invalid_args',
      issues,
    });
  },
};

/** A render request that may be applied, or the `fail` code and payload the model gets back. */
type RenderRequest =
  | {
      readonly ok: true;
      readonly messages: A2uiMessage[];
      readonly surface: { readonly surfaceId: string; readonly catalogId: string };
    }
  | { readonly ok: false; readonly code: string; readonly result: unknown };

/**
 * Everything that must hold before a single message is applied: envelope schema,
 * the cross-message rules, a `createSurface` with a fresh id, no writes to
 * client-owned paths, the selection at its fixed path, no unknown component or
 * function name. The first violation wins.
 */
function validateRenderRequest(
  args: unknown,
  renderer: A2uiRendererService,
  catalogs: readonly AngularCatalog[],
): RenderRequest {
  const parsed = A2uiMessageListWrapperSchema.safeParse(args);
  if (!parsed.success) {
    return { ok: false, code: 'invalid_messages', result: parsed.error.issues };
  }
  const messages = parsed.data.messages;

  const violations = findStructuralViolations(messages);
  if (violations.length > 0) {
    return { ok: false, code: 'invalid_messages', result: violations };
  }

  const surface = createdSurface(messages);
  if (surface === undefined) {
    return {
      ok: false,
      code: 'invalid_messages',
      result: [
        { path: ['messages'], message: 'createSurface needs both a surfaceId and a catalogId.' },
      ],
    };
  }
  if (renderer.surfaceGroup.getSurface(surface.surfaceId) !== undefined) {
    return {
      ok: false,
      code: 'invalid_messages',
      result: [
        {
          path: ['messages'],
          message: `Surface '${surface.surfaceId}' already exists; use a fresh surfaceId.`,
        },
      ],
    };
  }

  const forbiddenModelWrites = findForbiddenModelWrites(messages);
  if (forbiddenModelWrites.length > 0) {
    return {
      ok: false,
      code: 'forbidden_model_writes',
      result: `Bind these paths instead of writing them; the client mounts their values: ${forbiddenModelWrites.join(', ')}.`,
    };
  }

  const selectionViolations = findSelectionPathViolations(messages);
  if (selectionViolations.length > 0) {
    return { ok: false, code: 'invalid_messages', result: selectionViolations };
  }

  // An unknown catalog id stays with the processor, which throws for it.
  const catalog = catalogs.find((candidate) => candidate.id === surface.catalogId);
  if (catalog !== undefined) {
    const unknownComponents = findUnknownComponents(messages, catalog);
    if (unknownComponents.length > 0) {
      return {
        ok: false,
        code: 'catalog',
        result: `Unknown component(s): ${unknownComponents.join(', ')}.`,
      };
    }
    const unknownFunctions = findFunctionCalls(messages).filter(
      (name) => !catalog.functions.has(name),
    );
    if (unknownFunctions.length > 0) {
      return {
        ok: false,
        code: 'catalog',
        result: `Unknown function(s): ${unknownFunctions.join(', ')}.`,
      };
    }
  }

  return { ok: true, messages, surface };
}

/**
 * The processor validates props only for names the catalog knows and skips the
 * rest silently — an unknown name would reach the screen as a blank spot, so
 * it is rejected here instead. Unknown function calls are rejected for the same
 * reason: the invoker resolves them to `undefined`, an empty value on screen.
 */
function findUnknownComponents(
  messages: readonly A2uiMessage[],
  catalog: AngularCatalog,
): string[] {
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

function createClientDataMessages(surfaceId: string, store: SurfaceDataStore): A2uiMessage[] {
  const set = (path: string, value: unknown): A2uiMessage => ({
    version: 'v0.9',
    updateDataModel: { surfaceId, path, value },
  });

  // The renderer patches a mounted object in place (the reserve handler writes `remaining`), so
  // copies cross the boundary and the store's objects stay untouched.
  const confs = store.confs().map((conf) => ({ ...conf }));
  const messages = [set(LIST_PATH, confs)];
  const me = store.me();
  if (me !== undefined) messages.push(set('/me', me));
  const byMonth = store.byMonth();
  if (byMonth !== undefined) messages.push(set('/byMonth', [...byMonth]));
  const byTopic = store.byTopic();
  if (byTopic !== undefined) messages.push(set('/byTopic', [...byTopic]));
  // Pre-set so a detail view is never empty; the model binds the selection, never writes it.
  if (confs.length > 0) messages.push(set(SELECTION_PATH, { ...confs[0] }));
  return messages;
}

function deleteSurface(renderer: A2uiRendererService, surfaceId: string): void {
  if (renderer.surfaceGroup.getSurface(surfaceId) === undefined) return;
  renderer.processMessages([{ version: 'v0.9', deleteSurface: { surfaceId } }]);
}

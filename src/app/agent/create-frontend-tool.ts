import type { Type } from '@angular/core';
import { registerFrontendTool, type ToolRenderer } from '@copilotkit/angular';
import type { z } from 'zod';

/** The slice of CopilotKit's handler context our tools consume. */
export interface FrontendToolContext {
  readonly toolCall: { readonly id: string };
}

/** Every tool result carries `ok`; failures add `code`, details ride in `result`. */
export interface ToolResult {
  readonly ok: boolean;
  readonly code?: string;
  readonly result?: unknown;
}

/**
 * Authoring format for a client tool. The fields shared with CopilotKit's
 * `FrontendToolConfig` (`name`, `description`, `parameters`, `component`,
 * `followUp`, `agentId`) pass through verbatim and keep CopilotKit's
 * semantics — e.g. `followUp: false` is evaluated by CopilotKit's runtime,
 * which then skips the automatic follow-up run after the handler.
 */
export interface FrontendToolSpec<Args extends Record<string, unknown>> {
  readonly name: string;
  readonly description: string;
  readonly parameters: z.ZodType<Args>;
  readonly component?: Type<ToolRenderer<Args>>;
  /** Required by design: CopilotKit's implicit default (run the model again) is insider knowledge. */
  readonly followUp: boolean;
  readonly agentId?: string;
  readonly handler: (args: Args, context: FrontendToolContext) => Promise<ToolResult>;
  /** Invoked when the boundary rejects the raw arguments (code `invalid_args`). */
  readonly onValidationFailure?: (context: FrontendToolContext, issues: unknown) => void;
}

/** What actually gets registered: same spec, but the handler takes untrusted input. */
export interface BoundFrontendTool<Args extends Record<string, unknown>> {
  readonly name: string;
  readonly description: string;
  readonly parameters: z.ZodType<Args>;
  readonly component?: Type<ToolRenderer<Args>>;
  readonly followUp: boolean;
  readonly agentId?: string;
  readonly handler: (args: unknown, context: FrontendToolContext) => Promise<ToolResult>;
}

const TURN_END_SUFFIX = ' Calling this tool ends your turn.';

/** Registers a client tool with CopilotKit. Must run in an injection context. */
export function createFrontendTool<Args extends Record<string, unknown>>(
  spec: FrontendToolSpec<Args>,
): void {
  registerFrontendTool<Args>(bindFrontendTool(spec));
}

/**
 * CopilotKit only JSON-parses tool arguments and never checks them against
 * `parameters`, so this boundary validates them — the handlers and the pure
 * functions below them trust their input. Exported so specs exercise exactly
 * what production registers.
 */
export function bindFrontendTool<Args extends Record<string, unknown>>(
  spec: FrontendToolSpec<Args>,
): BoundFrontendTool<Args> {
  return {
    name: spec.name,
    description:
      spec.followUp === false ? `${spec.description}${TURN_END_SUFFIX}` : spec.description,
    parameters: spec.parameters,
    component: spec.component,
    followUp: spec.followUp,
    agentId: spec.agentId,
    handler: async (args, context) => {
      const parsed = spec.parameters.safeParse(args);
      if (!parsed.success) {
        spec.onValidationFailure?.(context, parsed.error.issues);
        return { ok: false, code: 'invalid_args', result: parsed.error.issues };
      }
      return spec.handler(parsed.data, context);
    },
  };
}

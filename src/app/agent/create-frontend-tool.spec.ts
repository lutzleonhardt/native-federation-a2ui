import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  bindFrontendTool,
  type FrontendToolContext,
  type FrontendToolSpec,
} from './create-frontend-tool';

const context: FrontendToolContext = { toolCall: { id: 'tc-1' } };

const argsSchema = z.object({ limit: z.number().int().positive() });
type Args = z.infer<typeof argsSchema>;

function spec(overrides: Partial<FrontendToolSpec<Args>> = {}): FrontendToolSpec<Args> {
  return {
    name: 'demoTool',
    description: 'A demo tool.',
    parameters: argsSchema,
    followUp: true,
    handler: async () => ({ ok: true }),
    ...overrides,
  };
}

describe('bindFrontendTool', () => {
  it('appends the turn-end sentence only for followUp: false', () => {
    expect(bindFrontendTool(spec({ followUp: false })).description).toBe(
      'A demo tool. Calling this tool ends your turn.',
    );
    expect(bindFrontendTool(spec({ followUp: true })).description).toBe('A demo tool.');
  });

  it('passes name, parameters, component, followUp, and agentId through unchanged', () => {
    const withMeta = spec({ followUp: false, agentId: 'assistant' });
    const bound = bindFrontendTool(withMeta);
    expect(bound.name).toBe('demoTool');
    expect(bound.parameters).toBe(argsSchema);
    expect(bound.followUp).toBe(false);
    expect(bound.agentId).toBe('assistant');
  });

  it('rejects arguments that fail the schema and never calls the handler', async () => {
    const handler = vi.fn();
    const bound = bindFrontendTool(spec({ handler }));

    const outcome = await bound.handler({ limit: '90' }, context);

    expect(outcome.ok).toBe(false);
    expect(outcome.code).toBe('invalid_args');
    expect(outcome.result).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['limit'] })]),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the handler with the parsed arguments and the context, returning its result', async () => {
    const handler = vi.fn(async () => ({ ok: true, result: 'done' }));
    const bound = bindFrontendTool(spec({ handler }));

    const outcome = await bound.handler({ limit: 3 }, context);

    expect(handler).toHaveBeenCalledExactlyOnceWith({ limit: 3 }, context);
    expect(outcome).toEqual({ ok: true, result: 'done' });
  });
});

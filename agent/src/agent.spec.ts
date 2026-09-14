import type { Context } from '@ag-ui/core';
import { RequestContext } from '@mastra/core/request-context';
import { describe, expect, it } from 'vitest';
import {
  CATALOG_CONTEXT_DESCRIPTION,
  LOCATION_CONTEXT_DESCRIPTION,
} from '../../shared/agent-contract.js';
import { createAssistantAgent } from './agent.js';

/**
 * Covers the wiring `prompt.spec.ts` cannot see: that the agent actually reads
 * the key `@ag-ui/mastra` parks the run's context under. A rename on either
 * side would leave the prompt silently without vocabulary.
 */
const AG_UI_KEY = 'ag-ui';

const catalogEntry: Context = {
  description: CATALOG_CONTEXT_DESCRIPTION,
  value: JSON.stringify({ catalogId: 'c', components: { Gauge: {} }, functions: { daysUntil: {} } }),
};

function agentWithContext(context: readonly Context[] | undefined): Promise<string> {
  const requestContext = new RequestContext();
  if (context !== undefined) requestContext.set(AG_UI_KEY, { context });
  const instructions = createAssistantAgent('openai/gpt-4o-mini').getInstructions({ requestContext });
  return Promise.resolve(instructions).then(String);
}

describe('createAssistantAgent', () => {
  it('T9-AC-01 builds the instructions from the context parked under the ag-ui key', async () => {
    const instructions = await agentWithContext([
      catalogEntry,
      { description: LOCATION_CONTEXT_DESCRIPTION, value: JSON.stringify({ city: 'Berlin' }) },
    ]);

    expect(instructions).toContain('Gauge');
    expect(instructions).toContain('Berlin');
  });

  it('T9-AC-01 falls back to the no-vocabulary note when no run context is parked', async () => {
    expect(await agentWithContext(undefined)).toContain('No custom vocabulary available');
  });

  it('resolves the instructions per call, so a changed location reaches the next run', async () => {
    const first = await agentWithContext([
      catalogEntry,
      { description: LOCATION_CONTEXT_DESCRIPTION, value: JSON.stringify({ city: 'Berlin' }) },
    ]);
    const second = await agentWithContext([
      catalogEntry,
      { description: LOCATION_CONTEXT_DESCRIPTION, value: JSON.stringify({ city: 'Wien' }) },
    ]);

    expect(first).toContain('Berlin');
    expect(second).toContain('Wien');
    expect(second).not.toContain('Berlin');
  });
});

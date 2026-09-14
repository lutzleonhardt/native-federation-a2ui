import type { Context } from '@ag-ui/core';
import { Agent } from '@mastra/core/agent';
import type { MastraModelConfig } from '@mastra/core/llm';
import { ASSISTANT_AGENT_ID } from '../../shared/agent-contract.js';
import { buildInstructions } from './prompt.js';

/** `@ag-ui/mastra` parks the run's AG-UI input here (`applyInputContext`); Mastra itself never reads it. */
const AG_UI_KEY = 'ag-ui';

/**
 * What sits under {@link AG_UI_KEY}. `context` needs no runtime check here: the
 * route rejects anything `RunAgentInputSchema` does not accept, and that schema
 * requires `context` — so every value reaching this point is already validated.
 * Absent only when `getInstructions()` is called outside a run.
 */
interface ParkedAgUiInput {
  readonly context: readonly Context[];
}

export function createAssistantAgent(model: MastraModelConfig): Agent {
  return new Agent({
    id: ASSISTANT_AGENT_ID,
    name: ASSISTANT_AGENT_ID,
    description: 'ConferenceFinder assistant',
    // A function, not a constant: the context carries the catalog and the user's
    // location, and Mastra resolves it per run (`getInstructions`).
    instructions: ({ requestContext }) =>
      buildInstructions(
        requestContext.get<typeof AG_UI_KEY, ParkedAgUiInput | undefined>(AG_UI_KEY)?.context ?? [],
      ),
    model,
  });
}

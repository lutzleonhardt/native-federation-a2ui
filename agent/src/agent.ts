import { Agent } from '@mastra/core/agent';
import type { MastraModelConfig } from '@mastra/core/llm';

export const ASSISTANT_AGENT_ID = 'assistant';

/** Placeholder until the request-driven prompt lands; the server stays free of A2UI knowledge. */
const INSTRUCTIONS = [
  'You are the ConferenceFinder assistant.',
  'Help the user find developer conferences and answer questions about them.',
  'Answer briefly and in the language the user writes in.',
].join(' ');

export function createAssistantAgent(model: MastraModelConfig): Agent {
  return new Agent({
    id: ASSISTANT_AGENT_ID,
    name: ASSISTANT_AGENT_ID,
    description: 'ConferenceFinder assistant',
    instructions: INSTRUCTIONS,
    model,
  });
}

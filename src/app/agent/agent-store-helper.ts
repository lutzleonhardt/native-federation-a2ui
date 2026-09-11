import { inject, type Signal } from '@angular/core';
import { type AgentStore, CopilotKit } from '@copilotkit/angular';

/**
 * The chat operations CopilotKit's prebuilt chat keeps to itself. `sendMessage`
 * mirrors its `submitInput` — append, then run through the core so tools and
 * context ride along — so a scripted send is indistinguishable from a typed one.
 */
export class AgentStoreHelper {
  constructor(
    private readonly store: Signal<AgentStore>,
    private readonly copilotKit: CopilotKit,
  ) {}

  sendMessage(text: string): Promise<void> {
    this.store().agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: text });
    return this.continueTurn();
  }

  /** Runs the agent on the transcript as it stands, e.g. after a turn-ending tool call failed. */
  async continueTurn(): Promise<void> {
    const { agent } = this.store();
    await this.copilotKit.core.runAgent({ agent });
  }

  reset(): void {
    const { agent } = this.store();
    agent.setMessages([]);
    agent.setState({});
  }
}

/** Must run in an injection context. */
export function createAgentStoreHelper(store: Signal<AgentStore>): AgentStoreHelper {
  return new AgentStoreHelper(store, inject(CopilotKit));
}

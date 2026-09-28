import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import { AGENT_CAPABILITIES } from '../a2ui/agent-capabilities.token';
import { catalogToContextEntry } from '../a2ui/catalog-context';
import { createAgentStoreHelper } from '../agent/agent-store-helper';
import { AGENT_MODE } from '../agent/assistant-agent.token';
import { initAgentStore } from '../agent/init-agent-store';
import { meToContextEntry } from '../agent/me-context-entry';
import { findConferencesTool } from '../agent/tools/find-conferences.tool';
import { messageWidgetTool } from '../agent/tools/message-widget.tool';
import { renderSurfaceTool } from '../agent/tools/render-surface.tool';
import { LocationStore } from '../domain/location.store';
import { ChatHeaderComponent } from './chat-header.component';
import { EXAMPLE_PROMPTS } from './example-prompts';

@Component({
  selector: 'app-chat-page',
  imports: [ChatHeaderComponent, CopilotChat],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.page.html',
  styleUrl: './chat.page.css',
  // The theme's CopilotKit zone reads the mode from here (`src/theme/copilotkit.css`).
  host: { '[attr.data-agent-mode]': 'mode' },
})
export class ChatPage {
  private readonly location = inject(LocationStore);
  private readonly store = initAgentStore({
    agentId: ASSISTANT_AGENT_ID,
    frontendTools: [findConferencesTool, renderSurfaceTool, messageWidgetTool],
    // Both entries travel with every run; the agent's prompt (`agent/src/prompt.ts`) turns
    // them into its vocabulary and location sections. The loaded capabilities are fixed for
    // the app's lifetime, `me` changes between runs — hence value vs. accessor.
    context: [
      catalogToContextEntry(inject(AGENT_CAPABILITIES).map((capability) => capability.vocabulary)),
      () => meToContextEntry(this.location.me()),
    ],
  });
  private readonly chat = createAgentStoreHelper(this.store);

  protected readonly agentId = ASSISTANT_AGENT_ID;
  protected readonly mode = inject(AGENT_MODE);
  protected readonly prompts = EXAMPLE_PROMPTS;
  // A send during a run would detach it mid-stream and leave a half-streamed
  // tool call in the transcript; CopilotKit's own input blocks the same way.
  protected readonly running = computed(() => this.store().isRunning());

  constructor() {
    this.location.init();
  }

  protected send(prompt: string): void {
    void this.chat.sendMessage(prompt);
  }
}

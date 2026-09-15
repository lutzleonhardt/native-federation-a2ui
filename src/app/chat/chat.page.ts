import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';
import { ASSISTANT_AGENT_ID } from '../../../shared/agent-contract';
import { AGENT_CAPABILITIES } from '../a2ui/agent-capabilities.token';
import { catalogToContextEntry } from '../a2ui/catalog-context';
import { createAgentStoreHelper } from '../agent/agent-store-helper';
import { initAgentStore } from '../agent/init-agent-store';
import { meToContextEntry } from '../agent/me-context-entry';
import { findConferencesTool } from '../agent/tools/find-conferences.tool';
import { messageWidgetTool } from '../agent/tools/message-widget.tool';
import { renderSurfaceTool } from '../agent/tools/render-surface.tool';
import { LocationStore } from '../domain/location.store';
import { EXAMPLE_PROMPTS } from './example-prompts';
import { LocationPickerComponent } from './location-picker.component';

@Component({
  selector: 'app-chat-page',
  imports: [CopilotChat, LocationPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.page.html',
  styles: `
    :host {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1.5rem;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #ddd;
    }
    .cf-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    copilot-chat {
      flex: 1;
      min-height: 0;
    }
  `,
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

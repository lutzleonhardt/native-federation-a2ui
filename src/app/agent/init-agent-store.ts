import {
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  type Signal,
} from '@angular/core';
import type { Context } from '@ag-ui/core';
import { type AgentStore, connectAgentContext, CopilotKit, injectAgentStore } from '@copilotkit/angular';
import { RUN_RECORDER } from '../replay/recorder';
import { createAgentStoreHelper } from './agent-store-helper';
import { type AnyFrontendToolSpec, createFrontendTool } from './create-frontend-tool';
import { correctRenderFailures } from './render-failure-correction';
import { RENDER_FAILURE_HANDLER } from './render-failure-handler.token';

export interface InitAgentStoreOptions {
  readonly agentId: string;
  readonly frontendTools: readonly AnyFrontendToolSpec[];
  /** An accessor is re-read whenever a signal it touches changes, so the next run sees the new value. */
  readonly context: readonly (Context | (() => Context))[];
}

/**
 * Wires one agent into CopilotKit for the lifetime of the calling injection
 * context: tools, context entries, the render-failure correction channel and,
 * when provided, the recorder of the live agent's answers.
 */
export function initAgentStore(options: InitAgentStoreOptions): Signal<AgentStore> {
  const store = injectAgentStore(options.agentId);
  const destroyRef = inject(DestroyRef);
  const chat = createAgentStoreHelper(store);
  const toolInjector = createEnvironmentInjector(
    [
      {
        provide: RENDER_FAILURE_HANDLER,
        useValue: correctRenderFailures(chat, store().agent, destroyRef),
      },
    ],
    inject(EnvironmentInjector),
  );
  destroyRef.onDestroy(() => toolInjector.destroy());
  inject(RUN_RECORDER)?.(store().agent, destroyRef);

  runInInjectionContext(toolInjector, () => {
    for (const tool of options.frontendTools) {
      createFrontendTool({ ...tool, agentId: options.agentId });
    }
  });
  for (const entry of options.context) {
    connectAgentContext(entry);
  }
  publishToolResults(inject(CopilotKit), store, options.agentId, destroyRef);
  return store;
}

/**
 * Workaround for a CopilotKit 0.3.1 bug: the core splices a tool result into
 * `agent.messages` without notifying agent subscribers, so after a turn-ending
 * tool (`followUp: false`) the store — and with it the tool renderer's status —
 * would only catch up on the next run. Deferred by a macrotask because the
 * result is spliced only after `onToolExecutionEnd`; skipped while a follow-up
 * run is underway, since that run notifies on its own.
 */
function publishToolResults(
  copilotKit: CopilotKit,
  store: Signal<AgentStore>,
  agentId: string,
  destroyRef: DestroyRef,
): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const subscription = copilotKit.core.subscribe({
    onToolExecutionEnd: (event) => {
      if (event.agentId !== agentId) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const { agent } = store();
        // Same list, re-set purely for the `onMessagesChanged` notification that
        // flips the tool renderer to "complete" — the side effect is the point.
        if (!agent.isRunning) agent.setMessages(agent.messages);
      }, 0);
    },
  });
  destroyRef.onDestroy(() => {
    subscription.unsubscribe();
    clearTimeout(timer);
  });
}

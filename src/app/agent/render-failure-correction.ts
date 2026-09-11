import type { DestroyRef } from '@angular/core';
import type { AbstractAgent } from '@ag-ui/client';
import type { AgentStoreHelper } from './agent-store-helper';
import type { RenderFailure, RenderFailureHandler } from './render-failure-handler.token';

/** Correction runs per user turn before the shell gives up; a user message resets the budget. */
export const MAX_CORRECTIONS_PER_TURN = 3;

/**
 * `renderSurface` ends the turn, so a failed call leaves the model without a
 * signal unless the shell starts a correction run; the tool result already
 * carries code and issues, only the run is missing. The handler fires from
 * inside the failing tool call, before CopilotKit has spliced that result —
 * hence one deferred run per batch of failures, never one per failure. The
 * budget caps the loop: every correction is a top-level run, outside
 * CopilotKit's follow-up depth limit.
 */
export function correctRenderFailures(
  chat: AgentStoreHelper,
  agent: AbstractAgent,
  destroyRef: DestroyRef,
): RenderFailureHandler {
  let corrections = 0;
  let pending: RenderFailure[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  const subscription = agent.subscribe({
    onRunInitialized: ({ input }) => {
      // A run opened by a user message is a new turn.
      if (input.messages.at(-1)?.role === 'user') corrections = 0;
    },
  });
  destroyRef.onDestroy(() => {
    subscription.unsubscribe();
    clearTimeout(timer);
  });

  return (failure) => {
    console.warn('renderSurface failed', failure);
    pending.push(failure);
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      const failures = pending;
      pending = [];
      if (corrections >= MAX_CORRECTIONS_PER_TURN) {
        console.error(
          `renderSurface: giving up after ${MAX_CORRECTIONS_PER_TURN} corrections this turn`,
          failures,
        );
        return;
      }
      corrections += 1;
      void chat.continueTurn();
    }, 0);
  };
}

import { InjectionToken } from '@angular/core';

export interface RenderFailure {
  readonly toolCallId: string;
  readonly code: string;
  readonly issues: unknown;
}

export type RenderFailureHandler = (failure: RenderFailure) => void;

/**
 * `followUp` is static in CopilotKit 0.3, so a failed `renderSurface` cannot
 * request a correction run by itself; the chat page binds this token to turn
 * failures into a correction run. Default: log and move on.
 */
export const RENDER_FAILURE_HANDLER = new InjectionToken<RenderFailureHandler>(
  'RENDER_FAILURE_HANDLER',
  { factory: () => (failure) => console.warn('renderSurface failed', failure) },
);

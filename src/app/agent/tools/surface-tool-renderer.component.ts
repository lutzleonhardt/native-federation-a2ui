import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SurfaceComponent } from '@a2ui/angular/v0_9';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import type { RenderSurfaceArgs } from './render-surface.definition';

/**
 * Chat-side view of a `renderSurface` call. The surface itself lives in the
 * root `A2uiRendererService`, so re-instantiation of this component is harmless.
 */
@Component({
  selector: 'app-surface-tool-renderer',
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './surface-tool-renderer.component.html',
  styles: `
    .cf-placeholder {
      color: #666;
      font-style: italic;
    }
    .cf-error {
      color: #b3261e;
    }
  `,
})
export class SurfaceToolRendererComponent implements ToolRenderer<RenderSurfaceArgs> {
  readonly toolCall = input.required<AngularToolCall<RenderSurfaceArgs>>();

  protected readonly pending = computed(() => this.toolCall().status !== 'complete');

  private readonly outcome = computed(() => {
    const call = this.toolCall();
    return call.status === 'complete' ? parseOutcome(call.result) : undefined;
  });

  protected readonly surfaceId = computed(() => {
    if (this.outcome()?.ok !== true) return undefined;
    return createdSurfaceId(this.toolCall().args.messages);
  });

  protected readonly errorText = computed(() => {
    const outcome = this.outcome();
    if (outcome === undefined || outcome.ok === true) {
      return 'Could not build the surface.';
    }
    return `Could not build the surface (${String(outcome.code ?? 'unknown')}).`;
  });
}

function parseOutcome(raw: string): { ok?: unknown; code?: unknown } | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    return parsed as { ok?: unknown; code?: unknown };
  } catch {
    return undefined;
  }
}

function createdSurfaceId(messages: readonly unknown[] | undefined): string | undefined {
  for (const message of messages ?? []) {
    if (typeof message !== 'object' || message === null) continue;
    const { createSurface } = message as { createSurface?: { surfaceId?: unknown } };
    if (typeof createSurface?.surfaceId === 'string') return createSurface.surfaceId;
  }
  return undefined;
}

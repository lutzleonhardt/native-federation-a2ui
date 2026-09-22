import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import type { AngularToolCall } from '@copilotkit/angular';
import { ASSISTANT_CATALOG_ID } from '../a2ui/assistant-catalog';
import { bindFrontendTool } from '../agent/create-frontend-tool';
import { RENDER_FAILURE_HANDLER, type RenderFailure } from '../agent/render-failure-handler.token';
import { findConferencesTool } from '../agent/tools/find-conferences.tool';
import { MessageWidgetComponent } from '../agent/tools/message-widget.component';
import type { MessageWidgetArgs } from '../agent/tools/message-widget.definition';
import { messageWidgetTool } from '../agent/tools/message-widget.tool';
import type { RenderSurfaceArgs } from '../agent/tools/render-surface.definition';
import { renderSurfaceTool } from '../agent/tools/render-surface.tool';
import { SurfaceToolRendererComponent } from '../agent/tools/surface-tool-renderer.component';
import { LocationStore } from '../domain/location.store';

interface Scenario {
  readonly key: string;
  readonly label: string;
  build(surfaceId: string): unknown[];
}

function validSurface(surfaceId: string): unknown[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [
          { id: 'root', component: 'Column', children: ['headline', 'timeline', 'name'] },
          { id: 'headline', component: 'Text', text: { path: '/title' } },
          {
            id: 'timeline',
            component: 'Timeline',
            items: { path: '/filteredConfs' },
            selected: { path: '/selectedConf' },
          },
          { id: 'name', component: 'Text', text: { path: '/selectedConf/name' } },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId, path: '/title', value: 'Conferences near you' },
    },
  ];
}

/**
 * Dev sandbox (plan amendment, Task 6): drives the real client-tool pipeline —
 * bound handlers, guards, mounts, and the tool-renderer components — so the
 * tool layer is visible before the chat page lands in Task 7.
 */
@Component({
  selector: 'app-tool-playground',
  imports: [SurfaceToolRendererComponent, MessageWidgetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tool-playground.html',
  styles: `
    section {
      max-width: 56rem;
      margin: 0 auto;
      padding: 1rem;
    }
    button {
      margin: 0 0.5rem 0.5rem 0;
    }
    .muted {
      color: #666;
    }
    ol code {
      word-break: break-all;
    }
  `,
})
export class ToolPlayground {
  private readonly location = inject(LocationStore);
  // Child injector so RENDER_FAILURE_HANDLER calls land in the visible log
  // instead of the console — the same binding Task 7's chat page will do.
  private readonly toolInjector = Injector.create({
    providers: [
      {
        provide: RENDER_FAILURE_HANDLER,
        useValue: (failure: RenderFailure) =>
          this.log(`RENDER_FAILURE_HANDLER ← ${JSON.stringify(failure)}`),
      },
    ],
    parent: inject(Injector),
  });

  protected readonly me = this.location.me;
  protected readonly entries = signal<readonly string[]>([]);
  protected readonly surfaceCall = signal<AngularToolCall<RenderSurfaceArgs> | undefined>(
    undefined,
  );
  protected readonly messageCall = signal<AngularToolCall<MessageWidgetArgs> | undefined>(
    undefined,
  );
  private surfaceSeq = 0;

  protected readonly scenarios: readonly Scenario[] = [
    { key: 'valid', label: 'Valid surface', build: validSurface },
    {
      key: 'forbidden',
      label: "Forbidden write (path 'me')",
      build: (surfaceId) => [
        ...validSurface(surfaceId),
        { version: 'v0.9', updateDataModel: { surfaceId, path: 'me', value: { city: 'Atlantis' } } },
      ],
    },
    {
      key: 'unknown',
      label: 'Unknown component',
      build: (surfaceId) => [
        { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
        {
          version: 'v0.9',
          updateComponents: { surfaceId, components: [{ id: 'root', component: 'PieChart' }] },
        },
      ],
    },
    {
      key: 'delete',
      label: 'deleteSurface (boundary rejects it)',
      build: (surfaceId) => [
        { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
        { version: 'v0.9', deleteSurface: { surfaceId } },
      ],
    },
  ];

  protected setCity(id: string): void {
    this.location.setCity(id);
  }

  protected async runFindConferences(): Promise<void> {
    const bound = bindFrontendTool(findConferencesTool);
    const outcome = await runInInjectionContext(this.toolInjector, () =>
      bound.handler({ nearKm: 300 }, { toolCall: { id: 'pg-find' } }),
    );
    this.log(`findConferences → ${JSON.stringify(outcome)}`);
  }

  protected async runScenario(scenario: Scenario): Promise<void> {
    const surfaceId = `tool-playground-${++this.surfaceSeq}`;
    const messages = scenario.build(surfaceId);
    const args = { messages } as RenderSurfaceArgs;

    this.surfaceCall.set({ args, status: 'in-progress', result: undefined });
    await pause(400);

    const bound = bindFrontendTool(renderSurfaceTool);
    const outcome = await runInInjectionContext(this.toolInjector, () =>
      bound.handler({ messages }, { toolCall: { id: surfaceId } }),
    );
    this.log(`renderSurface (${scenario.label}) → ${JSON.stringify(outcome)}`);
    this.surfaceCall.set({ args, status: 'complete', result: JSON.stringify(outcome) });
  }

  protected async runMessageWidget(): Promise<void> {
    const text = 'The **next conference** starts soon — the details are in the surface. _(Markdown)_';
    const bound = bindFrontendTool(messageWidgetTool);
    const outcome = await runInInjectionContext(this.toolInjector, () =>
      bound.handler({ text }, { toolCall: { id: 'pg-message' } }),
    );
    this.log(`messageWidget → ${JSON.stringify(outcome)}`);
    this.messageCall.set({ args: { text }, status: 'complete', result: JSON.stringify(outcome) });
  }

  private log(line: string): void {
    this.entries.update((entries) => [line, ...entries].slice(0, 8));
  }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

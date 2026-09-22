import { TestBed } from '@angular/core/testing';
import { A2uiRendererService } from '@a2ui/angular/v0_9';
import type { AngularToolCall } from '@copilotkit/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideAgentCapabilities } from '../../a2ui/agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from '../../a2ui/assistant-catalog';
import { capability as chartsCapability } from '../../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../../projects/mfe-maps/src/capability';
import type { RenderSurfaceArgs } from './render-surface.definition';
import { SurfaceToolRendererComponent } from './surface-tool-renderer.component';

const SURFACE_ID = 'tool-renderer-surface';

const ARGS: RenderSurfaceArgs = {
  messages: [
    { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID } },
  ],
};

async function render(toolCall: AngularToolCall<RenderSurfaceArgs>) {
  const fixture = TestBed.createComponent(SurfaceToolRendererComponent);
  fixture.componentRef.setInput('toolCall', toolCall);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('SurfaceToolRendererComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAgentCapabilities([chartsCapability, mapsCapability])],
    });
  });

  it('shows the placeholder while the call is streaming or executing', async () => {
    const host = await render({ args: {}, status: 'in-progress', result: undefined });

    expect(host.textContent).toContain('Building surface');
    expect(host.querySelector('a2ui-v09-surface')).toBeNull();
  });

  it('T6-AC-07 shows the surface for a complete ok call', async () => {
    TestBed.inject(A2uiRendererService).processMessages([
      {
        version: 'v0.9',
        createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: SURFACE_ID,
          components: [{ id: 'root', component: 'Text', text: 'Hello surface' }],
        },
      },
    ]);

    const host = await render({
      args: ARGS,
      status: 'complete',
      result: JSON.stringify({ ok: true, surfaceId: SURFACE_ID }),
    });

    expect(host.querySelector('a2ui-v09-surface')).not.toBeNull();
    // The basic `Text` renders markdown asynchronously.
    await vi.waitFor(() => expect(host.textContent).toContain('Hello surface'));
  });

  it('T6-AC-07 shows the error text for a complete call with an ok: false result', async () => {
    const host = await render({
      args: ARGS,
      status: 'complete',
      result: JSON.stringify({ ok: false, code: 'forbidden_model_writes', result: 'nope' }),
    });

    expect(host.querySelector('a2ui-v09-surface')).toBeNull();
    expect(host.textContent).toContain('forbidden_model_writes');
  });
});

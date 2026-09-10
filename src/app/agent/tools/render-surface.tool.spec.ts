import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ASSISTANT_CATALOG_ID, createAssistantCatalog } from '../../a2ui/assistant-catalog';
import { provideA2uiCatalog } from '../../a2ui/provide-a2ui-catalog';
import { chartsFragment } from '../../capabilities/charts';
import { mapsFragment } from '../../capabilities/maps';
import type { ConferenceResult, FindConferencesResult } from '../../domain/find-conferences';
import { LocationStore } from '../../domain/location.store';
import { z } from 'zod';
import { bindFrontendTool, type ToolResult } from '../create-frontend-tool';
import { RENDER_FAILURE_HANDLER } from '../render-failure-handler.token';
import { SurfaceDataStore } from '../surface-data.store';
import { renderSurfaceArgsSchema, type RenderSurfaceArgs } from './render-surface.definition';
import { renderSurfaceTool } from './render-surface.tool';

const SURFACE_ID = 'chat-surface-1';

function conference(id: string, name: string, city: string, date: string): ConferenceResult {
  return {
    id,
    name,
    topic: 'angular',
    city,
    country: 'DE',
    lat: 52.52,
    lon: 13.405,
    dayOffset: 10,
    capacity: 500,
    remaining: 42,
    price: 299,
    url: `/conf-sites/${id}.html`,
    date,
    distanceKm: 100,
  };
}

const CONFS = [
  conference('c1', 'Alpha Conf', 'Berlin', '2026-10-01'),
  conference('c2', 'Beta Conf', 'München', '2026-11-01'),
  conference('c3', 'Gamma Conf', 'Hamburg', '2026-12-01'),
];

function createMsg(): unknown {
  return {
    version: 'v0.9',
    createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID },
  };
}

function componentsMsg(components: unknown[], surfaceId = SURFACE_ID): unknown {
  return { version: 'v0.9', updateComponents: { surfaceId, components } };
}

function timelineMsg(): unknown {
  return componentsMsg([{ id: 'root', component: 'Timeline', items: { path: '/filteredConfs' } }]);
}

function dataMsg(path: string, value: unknown): unknown {
  return { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path, value } };
}

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

describe('renderSurfaceTool', () => {
  let onFailure: Mock;

  beforeEach(() => {
    localStorage.clear();
    onFailure = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideA2uiCatalog(createAssistantCatalog([chartsFragment, mapsFragment])),
        { provide: RENDER_FAILURE_HANDLER, useValue: onFailure },
      ],
    });
  });

  function seedStore(result: FindConferencesResult = { confs: CONFS }): void {
    TestBed.inject(LocationStore).setCity('berlin');
    TestBed.inject(SurfaceDataStore).setResult(result);
  }

  async function runTool(messages: unknown[]): Promise<ToolResult> {
    const bound = bindFrontendTool(renderSurfaceTool);
    return TestBed.runInInjectionContext(() =>
      bound.handler({ messages }, { toolCall: { id: 'tc-render' } }),
    );
  }

  function surfaceOf(id: string) {
    return TestBed.inject(A2uiRendererService).surfaceGroup.getSurface(id);
  }

  it('T6-AC-01 renders three timeline markers from client-mounted data without any updateDataModel from the model', async () => {
    seedStore();

    const outcome = await runTool([createMsg(), timelineMsg()]);
    expect(outcome).toMatchObject({ ok: true, surfaceId: SURFACE_ID });

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();
    const markers = (fixture.nativeElement as HTMLElement).querySelectorAll('g.cf-marker');
    expect(markers).toHaveLength(3);
  });

  it('T6-AC-02 rejects model writes to client-owned paths and creates no surface', async () => {
    seedStore();

    // 'me' and '/me/' address the same location as '/me' in the data model's
    // path parsing; '' and '/' are root writes replacing every mounted path.
    for (const path of ['/filteredConfs', '/me', '/filteredConfs/0', 'me', '/me/', '', '/']) {
      const outcome = await runTool([createMsg(), timelineMsg(), dataMsg(path, [])]);
      expect(outcome).toMatchObject({ ok: false, code: 'forbidden_model_writes' });
      expect(surfaceOf(SURFACE_ID)).toBeUndefined();
    }
  });

  it('T6-AC-02 rejects an updateDataModel without a path at the boundary schema', async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      timelineMsg(),
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, value: [] } },
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_args' });
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('T6-AC-03 fails on an unknown component name and leaves no surface behind', async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      componentsMsg([{ id: 'root', component: 'Zeppelin' }]),
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'catalog' });
    expect(outcome.result).toBeDefined();
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });

  it('T6-AC-03 fails on a Card with children instead of child and leaves no surface behind', async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      componentsMsg([
        { id: 'root', component: 'Card', children: ['a'] },
        { id: 'a', component: 'Text', text: 'x' },
      ]),
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'catalog' });
    expect(String(outcome.result)).toContain('Card');
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });

  it('T6-AC-04 fails schema validation with zod issues when a message misses version', async () => {
    // Since the envelope moved into the tool schema, this fails at the
    // boundary (invalid_args) and still reaches the failure handler.
    const outcome = await runTool([
      { createSurface: { surfaceId: SURFACE_ID, catalogId: ASSISTANT_CATALOG_ID } },
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_args' });
    expect(outcome.result).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expect.any(String) })]),
    );
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('T6-AC-04 fails when a message targets another surfaceId', async () => {
    const outcome = await runTool([
      createMsg(),
      componentsMsg([{ id: 'root', component: 'Timeline', items: { path: '/filteredConfs' } }], 'other'),
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_messages' });
    expect(JSON.stringify(outcome.result)).toContain('mismatch');
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });

  it("T6-AC-05 mounts /me, /selectedConf, and grouped rows while the model's own writes are applied", async () => {
    seedStore({
      confs: CONFS,
      byMonth: [
        { label: '2026-10', value: 2 },
        { label: '2026-11', value: 1 },
      ],
    });

    const outcome = await runTool([createMsg(), timelineMsg(), dataMsg('/title', 'Konferenzen')]);
    expect(outcome).toMatchObject({ ok: true });

    const dataModel = surfaceOf(SURFACE_ID)?.dataModel;
    expect(dataModel?.get('/me')).toMatchObject({ city: 'Berlin' });
    expect(dataModel?.get('/me')).toEqual(TestBed.inject(LocationStore).me());
    expect(dataModel?.get('/selectedConf')).toMatchObject({ id: 'c1' });
    expect(dataModel?.get('/title')).toBe('Konferenzen');
    expect(dataModel?.get('/byMonth')).toMatchObject([
      { label: '2026-10', value: 2 },
      { label: '2026-11', value: 1 },
    ]);
  });

  it("T6-AC-05 keeps the model's own /selectedConf write instead of pre-setting the first conference", async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      timelineMsg(),
      dataMsg('/selectedConf', { id: 'model-pick' }),
    ]);

    expect(outcome).toMatchObject({ ok: true });
    expect(surfaceOf(SURFACE_ID)?.dataModel.get('/selectedConf')).toMatchObject({ id: 'model-pick' });
  });

  it('T6-AC-06 reports all forbidden model writes and invokes the failure handler exactly once', async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      timelineMsg(),
      dataMsg('/title', 'Konferenzen'),
      dataMsg('/filteredConfs', []),
      dataMsg('/me', {}),
    ]);
    const issues =
      'Bind these paths instead of writing them; the client mounts their values: /filteredConfs, /me.';

    expect(outcome).toEqual({ ok: false, code: 'forbidden_model_writes', result: issues });
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
    expect(onFailure).toHaveBeenCalledExactlyOnceWith({
      toolCallId: 'tc-render',
      code: 'forbidden_model_writes',
      issues,
    });
  });

  it('T6-AC-06 fires once per catalog failure and never on success', async () => {
    seedStore();

    await runTool([createMsg(), componentsMsg([{ id: 'root', component: 'Zeppelin' }])]);
    expect(onFailure).toHaveBeenCalledTimes(1);

    onFailure.mockClear();
    const outcome = await runTool([createMsg(), timelineMsg()]);
    expect(outcome).toMatchObject({ ok: true });
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('serializes the protocol envelope into the tool schema without deleteSurface', () => {
    // Structural assertions — the describe() texts alone must not satisfy this.
    const jsonSchema = z.toJSONSchema(renderSurfaceArgsSchema) as unknown as {
      properties: { messages: { items: { anyOf?: { properties?: Record<string, unknown> }[] } } };
    };

    const forms = jsonSchema.properties.messages.items.anyOf ?? [];
    expect(forms).toHaveLength(3);
    const formKeys = forms.flatMap((form) => Object.keys(form.properties ?? {}));
    expect(formKeys).toContain('createSurface');
    expect(formKeys).toContain('updateComponents');
    expect(formKeys).toContain('updateDataModel');
    expect(formKeys).not.toContain('deleteSurface');
  });

  it('reports a boundary rejection through the failure handler', async () => {
    const bound = bindFrontendTool(renderSurfaceTool);

    const outcome = await TestBed.runInInjectionContext(() =>
      bound.handler({ messages: 'nope' }, { toolCall: { id: 'tc-render' } }),
    );

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_args' });
    expect(onFailure).toHaveBeenCalledExactlyOnceWith({
      toolCallId: 'tc-render',
      code: 'invalid_args',
      issues: expect.anything(),
    });
  });

  it('rejects a reused surfaceId and leaves the first surface untouched', async () => {
    seedStore();

    const first = await runTool([createMsg(), timelineMsg()]);
    expect(first).toMatchObject({ ok: true });

    const second = await runTool([createMsg(), timelineMsg()]);

    expect(second).toMatchObject({ ok: false, code: 'invalid_messages' });
    expect(JSON.stringify(second.result)).toContain('already exists');
    expect(surfaceOf(SURFACE_ID)?.dataModel.get('/selectedConf')).toMatchObject({ id: 'c1' });
  });

  it('rejects deleteSurface at the boundary schema', async () => {
    seedStore();

    const outcome = await runTool([
      createMsg(),
      { version: 'v0.9', deleteSurface: { surfaceId: SURFACE_ID } },
    ]);

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_args' });
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });

  it('rejects deleteSurface past the boundary too (defense in depth, direct handler call)', async () => {
    seedStore();

    const args = {
      messages: [createMsg(), { version: 'v0.9', deleteSurface: { surfaceId: SURFACE_ID } }],
    } as unknown as RenderSurfaceArgs;
    const outcome = await TestBed.runInInjectionContext(() =>
      renderSurfaceTool.handler(args, { toolCall: { id: 'tc-render' } }),
    );

    expect(outcome).toMatchObject({ ok: false, code: 'invalid_messages' });
    expect(JSON.stringify(outcome.result)).toContain('deleteSurface');
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });

  it('rolls back and reports when the client-data mount itself throws', async () => {
    seedStore();
    const renderer = TestBed.inject(A2uiRendererService);
    const original = renderer.processMessages.bind(renderer);
    let call = 0;
    vi.spyOn(renderer, 'processMessages').mockImplementation((messages) => {
      call += 1;
      // Second call is the client-data mount; the rollback (third) passes through.
      if (call === 2) throw new Error('mount exploded');
      return original(messages);
    });

    const outcome = await runTool([createMsg(), timelineMsg()]);

    expect(outcome).toMatchObject({ ok: false, code: 'catalog' });
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(surfaceOf(SURFACE_ID)).toBeUndefined();
  });
});

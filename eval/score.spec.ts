import { describe, expect, it } from 'vitest';
import { score, type RecordedCall } from './score';

const SURFACE_ID = 'confs-map-details';

/** The composition proven to render in the shell (`chat.page.spec.ts::requestThreeSurface`). */
function wiredSurface(components: readonly unknown[]): RecordedCall {
  return {
    messages: [
      { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: 'x' } },
      { version: 'v0.9', updateComponents: { surfaceId: SURFACE_ID, components } },
    ],
  };
}

function detailComponents(selection = '/selectedConf'): unknown[] {
  return [
    { id: 'root', component: 'Row', children: ['map', 'details'] },
    {
      id: 'map',
      component: 'Map',
      points: { path: '/filteredConfs' },
      center: { path: '/me' },
      selected: { path: selection },
    },
    { id: 'details', component: 'Column', children: ['name', 'days', 'far', 'seats', 'reserve'] },
    { id: 'name', component: 'Text', text: { path: `${selection}/name` } },
    {
      id: 'days',
      component: 'Text',
      text: { call: 'daysUntil', args: { date: { path: `${selection}/date` } }, returnType: 'number' },
    },
    {
      id: 'far',
      component: 'Text',
      text: { call: 'distance', args: { a: { path: '/me' }, b: { path: selection } }, returnType: 'number' },
    },
    {
      id: 'seats',
      component: 'Gauge',
      value: { path: `${selection}/remaining` },
      max: { path: `${selection}/capacity` },
    },
    { id: 'reserve-label', component: 'Text', text: 'Reservieren' },
    {
      id: 'reserve',
      component: 'Button',
      child: 'reserve-label',
      action: { event: { name: 'reserve', context: { id: { path: `${selection}/id` } } } },
    },
  ];
}

function withDataWrite(path: string, value: unknown): RecordedCall {
  const call = wiredSurface(detailComponents());
  return { messages: [...(call.messages ?? []), { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path, value } }] };
}

describe('score', () => {
  it('T9-AC-02 passes A3 for the wired surface', () => {
    expect(score('A3', [wiredSurface(detailComponents())])).toEqual({ passed: true, reasons: [] });
  });

  it('T9-AC-02 fails A3 when selected is a literal instead of a path', () => {
    const components = detailComponents().map((part) =>
      (part as { id: string }).id === 'map' ? { ...(part as object), selected: 'ng-atlas' } : part,
    );

    const verdict = score('A3', [wiredSurface(components)]);

    expect(verdict.passed).toBe(false);
    expect(verdict.reasons[0]).toContain('nothing is wired');
  });

  it('T9-AC-02 fails when /filteredConfs is written via updateDataModel', () => {
    const verdict = score('A3', [withDataWrite('/filteredConfs', [{ id: 'x' }])]);

    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContainEqual(expect.stringContaining('client-owned path /filteredConfs'));
  });

  it('T9-AC-02 fails when a data-model value carries a date literal', () => {
    const verdict = score('A3', [withDataWrite('/heading', 'Nächste Konferenz am 2026-10-24')]);

    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContainEqual(expect.stringContaining('date literal'));
  });

  it('follows the selection path the model chose rather than assuming /selectedConf', () => {
    expect(score('A3', [wiredSurface(detailComponents('/pick'))]).passed).toBe(true);
  });

  it('reports the missing pieces of a half-wired detail view', () => {
    const components = detailComponents().filter((part) => (part as { id: string }).id !== 'reserve');

    const verdict = score('A3', [wiredSurface(components)]);

    expect(verdict.reasons).toContainEqual(expect.stringContaining('reserve'));
  });

  it('scores A1 on a Timeline bound to /filteredConfs', () => {
    const timeline = [{ id: 'root', component: 'Timeline', items: { path: '/filteredConfs' } }];

    expect(score('A1', [wiredSurface(timeline)]).passed).toBe(true);
    expect(score('A1', [wiredSurface([{ id: 'root', component: 'Timeline', items: [] }])]).passed).toBe(false);
  });

  it('scores A2 on a Map bound to /filteredConfs and /me', () => {
    expect(score('A2', [wiredSurface(detailComponents())]).passed).toBe(true);

    const noCenter = detailComponents().map((part) =>
      (part as { id: string }).id === 'map' ? { id: 'map', component: 'Map', points: { path: '/filteredConfs' } } : part,
    );
    expect(score('A2', [wiredSurface(noCenter)]).reasons).toContainEqual(
      expect.stringContaining('center'),
    );
  });

  // Regression: these all scored as success while the scorer carried its own
  // copy of the host rules. The shell rejects every one of them.
  it.each(['/byMonth', '/byTopic', '/', ''])(
    'T9-AC-02 fails when the model writes the client-owned path "%s"',
    (path) => {
      const verdict = score('A3', [withDataWrite(path, [{ id: 'x' }])]);

      expect(verdict.passed).toBe(false);
      expect(verdict.reasons).toContainEqual(expect.stringContaining('client-owned path'));
    },
  );

  it('T9-AC-02 fails a call without a createSurface message', () => {
    const call = { messages: [wiredSurface(detailComponents()).messages![1]] };

    expect(score('A3', [call]).reasons).toContainEqual(
      expect.stringContaining('exactly one createSurface'),
    );
  });

  it('T9-AC-02 fails a call with two createSurface messages', () => {
    const [create, update] = wiredSurface(detailComponents()).messages!;

    expect(score('A3', [{ messages: [create, create, update] }]).reasons).toContainEqual(
      expect.stringContaining('exactly one createSurface'),
    );
  });

  it('T9-AC-02 fails a call that deletes a surface or addresses a foreign one', () => {
    const call = wiredSurface(detailComponents());
    const withDelete = {
      messages: [...call.messages!, { version: 'v0.9', deleteSurface: { surfaceId: SURFACE_ID } }],
    };
    const withForeignId = {
      messages: [
        ...call.messages!,
        { version: 'v0.9', updateDataModel: { surfaceId: 'other', path: '/x', value: 1 } },
      ],
    };

    expect(score('A3', [withDelete]).reasons).toContainEqual(expect.stringContaining('deleteSurface'));
    expect(score('A3', [withForeignId]).reasons).toContainEqual(
      expect.stringContaining('surfaceId mismatch'),
    );
  });

  it('fails any requirement when the model renders more than one surface', () => {
    const two = [wiredSurface(detailComponents()), wiredSurface(detailComponents())];

    expect(score('A3', two).reasons).toContainEqual(expect.stringContaining('exactly one renderSurface'));
  });
});

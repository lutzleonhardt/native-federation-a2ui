import { describe, expect, it } from 'vitest';
import { score, type AnnouncedNames, type RecordedSurface, type RecordedText } from './score';

const SURFACE_ID = 'confs-map-details';

/** The composition proven to render in the shell (`chat.page.spec.ts::requestThreeSurface`). */
function wiredSurface(components: readonly unknown[]): RecordedSurface {
  return {
    tool: 'renderSurface',
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

function withDataWrite(path: string, value: unknown): RecordedSurface {
  const call = wiredSurface(detailComponents());
  return {
    tool: 'renderSurface',
    messages: [
      ...(call.messages ?? []),
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path, value } },
    ],
  };
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
    const call: RecordedSurface = {
      tool: 'renderSurface',
      messages: [wiredSurface(detailComponents()).messages![1]],
    };

    expect(score('A3', [call]).reasons).toContainEqual(
      expect.stringContaining('exactly one createSurface'),
    );
  });

  it('T9-AC-02 fails a call with two createSurface messages', () => {
    const [create, update] = wiredSurface(detailComponents()).messages!;

    const call: RecordedSurface = { tool: 'renderSurface', messages: [create, create, update] };

    expect(score('A3', [call]).reasons).toContainEqual(
      expect.stringContaining('exactly one createSurface'),
    );
  });

  it('T9-AC-02 fails a call that deletes a surface or addresses a foreign one', () => {
    const call = wiredSurface(detailComponents());
    const withDelete: RecordedSurface = {
      tool: 'renderSurface',
      messages: [...call.messages!, { version: 'v0.9', deleteSurface: { surfaceId: SURFACE_ID } }],
    };
    const withForeignId: RecordedSurface = {
      tool: 'renderSurface',
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

describe('score A2-without-maps', () => {
  const CHARTS_ONLY: AnnouncedNames = {
    components: ['Gauge', 'Timeline'],
    functions: ['daysUntil'],
  };
  const REFUSAL: RecordedText = {
    tool: 'messageWidget',
    text: 'Eine Kartenansicht steht mir leider nicht zur Verfügung.',
  };
  const TIMELINE = wiredSurface([
    { id: 'root', component: 'Timeline', items: { path: '/filteredConfs' } },
  ]);

  it('T7-AC-02 passes a refusal that names the map, with or without an announced surface', () => {
    expect(score('A2-without-maps', [REFUSAL], CHARTS_ONLY).passed).toBe(true);
    expect(score('A2-without-maps', [REFUSAL, TIMELINE], CHARTS_ONLY).passed).toBe(true);
  });

  it('T7-AC-02 fails a Map the set does not announce, even next to an honest text', () => {
    const verdict = score(
      'A2-without-maps',
      [REFUSAL, wiredSurface(detailComponents())],
      CHARTS_ONLY,
    );

    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContain('component(s) outside the announced vocabulary: Map');
    expect(verdict.reasons).toContain('function(s) outside the announced vocabulary: distance');
  });

  it('T7-AC-02 fails an invented component and accepts basic functions', () => {
    const surface = wiredSurface([
      { id: 'root', component: 'Column', children: ['when', 'badge'] },
      {
        id: 'when',
        component: 'Text',
        text: {
          call: 'formatDate',
          args: { value: { path: '/selectedConf/date' }, format: 'dd.MM.yyyy' },
        },
      },
      { id: 'badge', component: 'Badge', label: 'neu' },
    ]);

    expect(score('A2-without-maps', [REFUSAL, surface], CHARTS_ONLY).reasons).toEqual([
      'component(s) outside the announced vocabulary: Badge',
    ]);
  });

  it('T7-AC-02 fails an answer that never names what is missing', () => {
    const silent = score('A2-without-maps', [TIMELINE], CHARTS_ONLY);
    const evasive = score(
      'A2-without-maps',
      [{ tool: 'messageWidget', text: 'Hier ist die Zeitleiste.' }, TIMELINE],
      CHARTS_ONLY,
    );

    expect(silent.reasons).toEqual(['no messageWidget text names the missing map']);
    expect(evasive.reasons).toEqual(['no messageWidget text names the missing map']);
  });

  it('applies the host rules to the optional surface', () => {
    const verdict = score('A2-without-maps', [REFUSAL, withDataWrite('/filteredConfs', [])], {
      components: ['Gauge', 'Timeline', 'Map'],
      functions: ['daysUntil', 'distance'],
    });

    expect(verdict.reasons).toContainEqual(
      expect.stringContaining('client-owned path /filteredConfs'),
    );
  });

  // Review finding: a Map the harness refused (wrong catalogId) was dropped before scoring,
  // so the text alone passed although the model had reached for the Map.
  it('T7-AC-02 fails a refused Map attempt, and keeps refused attempts away from A1–A3', () => {
    const refusedMap: RecordedSurface = { ...wiredSurface(detailComponents()), rejected: true };

    expect(score('A2-without-maps', [refusedMap, REFUSAL], CHARTS_ONLY).reasons).toEqual([
      'component(s) outside the announced vocabulary: Map',
      'function(s) outside the announced vocabulary: distance',
    ]);
    expect(score('A3', [refusedMap, wiredSurface(detailComponents())]).passed).toBe(true);
  });

  it('keeps a messageWidget call invisible to A1–A3', () => {
    expect(score('A1', [REFUSAL, TIMELINE]).passed).toBe(true);
    expect(score('A1', [REFUSAL]).reasons).toEqual([
      'expected exactly one renderSurface call, got 0',
    ]);
  });
});

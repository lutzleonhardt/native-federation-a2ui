import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocationStore } from '../../domain/location.store';
import { bindFrontendTool, type ToolResult } from '../create-frontend-tool';
import { SurfaceDataStore } from '../surface-data.store';
import { findConferencesTool } from './find-conferences.tool';

async function runTool(args: unknown): Promise<ToolResult> {
  const bound = bindFrontendTool(findConferencesTool);
  return TestBed.runInInjectionContext(() => bound.handler(args, { toolCall: { id: 'tc-find' } }));
}

describe('findConferencesTool', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T6-AC-08 writes confs with distanceKm to the store and returns a compact result without lat, lon, or capacity', async () => {
    TestBed.inject(LocationStore).setCity('berlin');
    const store = TestBed.inject(SurfaceDataStore);

    const outcome = await runTool({ nearKm: 300 });

    const confs = store.confs();
    expect(confs.length).toBeGreaterThan(0);
    for (const conf of confs) {
      expect(conf.distanceKm).toBeTypeOf('number');
    }
    expect(outcome).toMatchObject({
      ok: true,
      count: confs.length,
      mountedAt: '/filteredConfs',
      next: { id: confs[0].id, name: confs[0].name, city: confs[0].city, date: confs[0].date },
    });
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain('"lat"');
    expect(serialized).not.toContain('"lon"');
    expect(serialized).not.toContain('"capacity"');
  });

  it('rejects unparsed arguments at the tool boundary and leaves the store untouched', async () => {
    const store = TestBed.inject(SurfaceDataStore);

    const outcome = await runTool({ withinDays: '90' });

    expect(outcome.ok).toBe(false);
    expect(outcome.code).toBe('invalid_args');
    expect(store.confs()).toHaveLength(0);
  });

  it('mounts grouped counts that sum to the result size when groupBy is set', async () => {
    const store = TestBed.inject(SurfaceDataStore);

    const outcome = await runTool({ groupBy: 'month' });

    const byMonth = store.byMonth();
    expect(byMonth).toBeDefined();
    const total = (byMonth ?? []).reduce((sum, row) => sum + row.value, 0);
    expect(outcome).toMatchObject({ ok: true, count: total });
  });

  it('does not end the turn: the model must react to the compact result', () => {
    const bound = bindFrontendTool(findConferencesTool);

    expect(bound.followUp).toBe(true);
    expect(bound.description).not.toContain('ends your turn');
  });

  it('omits distanceKm everywhere while the location is unknown', async () => {
    const store = TestBed.inject(SurfaceDataStore);

    const outcome = await runTool({ limit: 3 });

    expect(store.confs()).toHaveLength(3);
    for (const conf of store.confs()) {
      expect(conf.distanceKm).toBeUndefined();
    }
    expect(JSON.stringify(outcome)).not.toContain('"distanceKm"');
  });
});

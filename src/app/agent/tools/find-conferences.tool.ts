import { inject } from '@angular/core';
import { loadConferences } from '../../domain/conference';
import { findConferences, type ConferenceResult } from '../../domain/find-conferences';
import type { FindConferencesArgs } from '../../domain/find-conferences.schema';
import { LocationStore } from '../../domain/location.store';
import type { FrontendToolSpec, ToolResult } from '../create-frontend-tool';
import { SurfaceDataStore } from '../surface-data.store';
import { findConferencesDefinition } from './find-conferences.definition';

/** Enough for the model to talk about the result; the data itself is bound, not copied. */
export interface FindConferencesToolResult extends ToolResult {
  readonly ok: true;
  readonly count: number;
  readonly mountedAt: '/filteredConfs';
  readonly next?: NextConference;
}

interface NextConference {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly date: string;
  readonly distanceKm?: number;
}

export const findConferencesTool: FrontendToolSpec<FindConferencesArgs> = {
  ...findConferencesDefinition,
  // Mid-turn step: the model gets a follow-up run to react to the compact result.
  followUp: true,
  handler: async (args): Promise<FindConferencesToolResult> => {
    const store = inject(SurfaceDataStore);
    const me = inject(LocationStore).me();
    const today = new Date();

    const result = findConferences(args, { confs: loadConferences(today), me, today });
    store.setResult(result);

    const next = result.confs[0];
    return {
      ok: true,
      count: result.confs.length,
      mountedAt: '/filteredConfs',
      ...(next === undefined ? {} : { next: toNext(next) }),
    };
  },
};

function toNext({ id, name, city, date, distanceKm }: ConferenceResult): NextConference {
  return { id, name, city, date, ...(distanceKm === undefined ? {} : { distanceKm }) };
}

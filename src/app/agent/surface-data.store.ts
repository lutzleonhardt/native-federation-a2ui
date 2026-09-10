import { computed, inject, Injectable, signal } from '@angular/core';
import type { FindConferencesResult } from '../domain/find-conferences';
import { LocationStore } from '../domain/location.store';

/**
 * Holds the data the client mounts into surfaces: structure comes from the
 * model, values come from here — never transcribed through the transcript.
 */
@Injectable({ providedIn: 'root' })
export class SurfaceDataStore {
  private readonly result = signal<FindConferencesResult>({ confs: [] });

  readonly confs = computed(() => this.result().confs);
  readonly byMonth = computed(() => this.result().byMonth);
  readonly byTopic = computed(() => this.result().byTopic);
  readonly me = inject(LocationStore).me;

  setResult(result: FindConferencesResult): void {
    this.result.set(result);
  }
}

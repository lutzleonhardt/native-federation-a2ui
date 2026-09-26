import { computed, inject, Injectable, signal } from '@angular/core';
import { applyReservations, ConferenceStore } from '../domain/conference.store';
import type { FindConferencesResult } from '../domain/find-conferences';
import { LocationStore } from '../domain/location.store';

/**
 * Holds the data the client mounts into surfaces: structure comes from the
 * model, values come from here — never transcribed through the transcript.
 * A surface is mounted once; `confs` already carries this page's reservations,
 * so a surface rendered after a reservation shows the reduced count.
 */
@Injectable({ providedIn: 'root' })
export class SurfaceDataStore {
  private readonly result = signal<FindConferencesResult>({ confs: [] });
  private readonly conferenceStore = inject(ConferenceStore);

  readonly confs = computed(() =>
    applyReservations(this.result().confs, this.conferenceStore.reservations()),
  );
  readonly byMonth = computed(() => this.result().byMonth);
  readonly byTopic = computed(() => this.result().byTopic);
  readonly me = inject(LocationStore).me;

  setResult(result: FindConferencesResult): void {
    this.result.set(result);
  }
}

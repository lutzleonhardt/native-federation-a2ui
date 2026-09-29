import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CITIES } from '../domain/cities';
import { LocationStore } from '../domain/location.store';

/**
 * Lives in the ink band and takes its colours; the select's option list stays native.
 * Pinned (replay), it only names the recordings' city.
 */
@Component({
  selector: 'app-location-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-picker.component.html',
  styleUrl: './location-picker.component.css',
})
export class LocationPickerComponent {
  private readonly location = inject(LocationStore);

  protected readonly cities = CITIES;
  protected readonly me = this.location.me;
  protected readonly pinned = this.location.pinned;
  private readonly changing = signal(false);
  protected readonly picking = computed(
    () => !this.pinned && (this.me() === undefined || this.changing()),
  );

  protected pick(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id === '') return;
    this.location.setCity(id);
    this.changing.set(false);
  }

  protected change(): void {
    this.changing.set(true);
  }
}

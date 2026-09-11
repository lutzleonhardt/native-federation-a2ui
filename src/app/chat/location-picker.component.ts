import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CITIES } from '../domain/cities';
import { LocationStore } from '../domain/location.store';

@Component({
  selector: 'app-location-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-picker.component.html',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class LocationPickerComponent {
  private readonly location = inject(LocationStore);

  protected readonly cities = CITIES;
  protected readonly me = this.location.me;
  private readonly changing = signal(false);
  protected readonly picking = computed(() => this.me() === undefined || this.changing());

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

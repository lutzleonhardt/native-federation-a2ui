import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CapabilityPanelComponent } from './capability-panel.component';
import { LocationPickerComponent } from './location-picker.component';

/** The app's chrome: ink band with name, location and capabilities over the prompt band. */
@Component({
  selector: 'app-chat-header',
  imports: [CapabilityPanelComponent, LocationPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.css',
})
export class ChatHeaderComponent {
  readonly prompts = input.required<readonly string[]>();
  /** Disables the prompts while the agent answers; the page owns the run state. */
  readonly running = input.required<boolean>();
  readonly send = output<string>();
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { CapabilityStatus } from '../federation/capability-status';
import { CAPABILITY_STATUS } from '../federation/capability-status.token';
import { toCapabilitiesQuery } from '../federation/select-capabilities';

/** One panel row: the status flattened for the template, plus the link that flips this entry. */
interface PanelEntry {
  readonly name: string;
  readonly state: CapabilityStatus['state'];
  readonly origin: string | undefined;
  readonly components: string;
  readonly functions: string;
  readonly toggleHref: string;
  readonly toggleLabel: 'Switch on' | 'Switch off';
}

/**
 * Makes the federation visible: every manifest remote in one of three states, and a link
 * per remote that reloads the app with that remote flipped. The selection has no in-app
 * state — the URL is its only source, so the list is fixed for the app's lifetime.
 */
@Component({
  selector: 'app-capability-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capability-panel.component.html',
  styles: `
    :host {
      display: flex;
      flex-basis: 100%;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.25rem 1rem;
      font-size: 0.875rem;
    }
    h2 {
      margin: 0;
      font-size: inherit;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.25rem 0.5rem;
    }
    li[data-state='unreachable'] {
      color: #b00020;
    }
    li[data-state='unselected'] {
      color: #666;
    }
  `,
})
export class CapabilityPanelComponent {
  protected readonly entries = toPanelEntries(inject(CAPABILITY_STATUS));
}

function toPanelEntries(statuses: readonly CapabilityStatus[]): PanelEntry[] {
  return statuses.map((status) => {
    const loaded = status.state === 'loaded' ? status : undefined;
    return {
      name: status.name,
      state: status.state,
      origin: loaded?.origin,
      components: names(
        loaded === undefined ? [] : Object.keys(loaded.capability.vocabulary.components),
      ),
      functions: names(
        loaded === undefined ? [] : loaded.capability.vocabulary.functions.map((fn) => fn.name),
      ),
      toggleHref: toCapabilitiesQuery(toggled(statuses, status.name)),
      toggleLabel: status.state === 'unselected' ? 'Switch on' : 'Switch off',
    };
  });
}

/** The current selection with `name` flipped, in manifest order. */
function toggled(statuses: readonly CapabilityStatus[], name: string): string[] {
  return statuses
    .filter((status) =>
      status.name === name ? status.state === 'unselected' : status.state !== 'unselected',
    )
    .map((status) => status.name);
}

function names(items: readonly string[]): string {
  return items.length === 0 ? 'none' : items.join(', ');
}

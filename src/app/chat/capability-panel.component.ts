import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { AGENT_PORT } from '../../../shared/agent-contract';
import { AGENT_MODE } from '../agent/assistant-agent.token';
import type { CapabilityStatus } from '../federation/capability-status';
import { CAPABILITY_STATUS } from '../federation/capability-status.token';
import { PAGE_SEARCH } from '../federation/page-search.token';
import { toCapabilitiesQuery } from '../federation/select-capabilities';

/** One panel row: the status flattened for the template, plus the link that flips this entry. */
interface PanelEntry {
  readonly name: string;
  readonly state: CapabilityStatus['state'];
  /** The state as the chip reads it: `unselected` is "off" to the user. */
  readonly stateLabel: 'loaded' | 'unreachable' | 'off';
  readonly origin: string;
  readonly components: string;
  readonly functions: string;
  readonly toggleHref: string;
  readonly toggleLabel: 'Switch on' | 'Switch off';
}

/** What an entry shows where a remote that did not load has nothing to list. */
const NONE = '—';

export const REPOSITORY_URL = 'https://github.com/lutzleonhardt/conference-finder#readme';
export const NF_DEVTOOLS_URL = 'https://native-federation.com/docs/v4/devtools/';

/**
 * Makes the federation visible: every manifest remote in one of three states, and a link
 * per remote that reloads the app with that remote flipped. The selection has no in-app
 * state — the URL is its only source, so the list is fixed for the app's lifetime. Below
 * the list, the Agent section says who answers the chat and how to get the live version.
 */
@Component({
  selector: 'app-capability-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capability-panel.component.html',
  styleUrl: './capability-panel.component.css',
})
export class CapabilityPanelComponent {
  protected readonly entries = toPanelEntries(inject(CAPABILITY_STATUS), inject(PAGE_SEARCH));
  protected readonly mode = inject(AGENT_MODE);
  protected readonly agentPort = AGENT_PORT;
  protected readonly repositoryUrl = REPOSITORY_URL;
  protected readonly devtoolsUrl = NF_DEVTOOLS_URL;
  private readonly details = viewChild.required<ElementRef<HTMLDetailsElement>>('details');

  /** Opens the disclosure for whoever points at the panel, e.g. the replay notice. */
  open(): void {
    this.details().nativeElement.open = true;
  }
}

function toPanelEntries(statuses: readonly CapabilityStatus[], search: string): PanelEntry[] {
  return statuses.map((status) => {
    const loaded = status.state === 'loaded' ? status : undefined;
    return {
      name: status.name,
      state: status.state,
      stateLabel: status.state === 'unselected' ? 'off' : status.state,
      origin: loaded?.origin ?? NONE,
      components: names(
        loaded === undefined ? [] : Object.keys(loaded.capability.vocabulary.components),
      ),
      functions: names(
        loaded === undefined ? [] : loaded.capability.vocabulary.functions.map((fn) => fn.name),
      ),
      toggleHref: toCapabilitiesQuery(toggled(statuses, status.name), search),
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
  return items.length === 0 ? NONE : items.join(', ');
}

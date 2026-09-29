import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { AbstractAgent } from '@ag-ui/client';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { capability as chartsCapability } from '../../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../../projects/mfe-maps/src/capability';
import { provideOfflineMap } from '../../../../projects/mfe-maps/src/testing/offline-map';
import { provideAgentCapabilities } from '../../a2ui/agent-capabilities.token';
import { provideReserveHandler } from '../../a2ui/reserve-handler';
import { ASSISTANT_AGENT, provideAssistantAgent } from '../../agent/assistant-agent.token';
import { loadedCapabilities, type CapabilityStatus } from '../../federation/capability-status';
import { provideCapabilityStatus } from '../../federation/capability-status.token';
import { PAGE_SEARCH } from '../../federation/page-search.token';
import type { ReplayPace } from '../../replay/paced-run';
import { ReplayAgent } from '../../replay/replay-agent';
import { capabilitySetKey, type Recordings } from '../../replay/recordings';
import { ChatPage } from '../chat.page';

/** The manifest's remotes, in manifest order; a spec names the ones it wants loaded. */
export type RemoteName = 'charts' | 'maps';
const MANIFEST: readonly RemoteName[] = ['charts', 'maps'];

/** What the federation bootstrap reports: the named remotes loaded, the rest unselected. */
function remoteStatuses(loaded: readonly RemoteName[]): CapabilityStatus[] {
  return MANIFEST.map((name) =>
    loaded.includes(name)
      ? {
          name,
          state: 'loaded',
          origin: `http://localhost:${name === 'charts' ? 4201 : 4202}/`,
          capability: name === 'charts' ? chartsCapability : mapsCapability,
        }
      : { name, state: 'unselected' },
  );
}

export interface LocalChatOptions {
  /** Default: both remotes. */
  readonly loaded?: readonly RemoteName[];
  /** `?record`: the recorder attaches to the agent. */
  readonly record?: boolean;
}

/** The chat page in local mode with `agent` behind `ASSISTANT_AGENT`, usually a scripted one. */
export async function renderChat(
  agent: AbstractAgent,
  options: LocalChatOptions = {},
): Promise<ComponentFixture<ChatPage>> {
  return render(options.loaded ?? MANIFEST, [
    provideAssistantAgent({ mode: 'local', record: options.record }),
    { provide: ASSISTANT_AGENT, useValue: agent },
  ]);
}

/** No pauses, one chunk per call — for the cases that look at what is played, not how it arrives. */
export const INSTANT: ReplayPace = { thinkMs: 0, chunkMs: 0, chunkChars: Number.MAX_SAFE_INTEGER };

export interface ReplayChatOptions {
  /** Default: both remotes; the recordings are looked up under this set's key. */
  readonly loaded?: readonly RemoteName[];
  /** Replaces the live pacing; absent, the run is paced like the live agent. */
  readonly pace?: ReplayPace;
  /** The picker id the recordings were captured in; replay pins the location to it. */
  readonly city?: string;
}

/** The real replay agent behind the real chat, as the deploy build wires it. */
export async function renderReplayChat(
  recordings: Recordings,
  options: ReplayChatOptions = {},
): Promise<ComponentFixture<ChatPage>> {
  const loaded = options.loaded ?? MANIFEST;
  const pace = options.pace;
  return render(loaded, [
    provideAssistantAgent({ mode: 'replay', recordings, city: options.city }),
    ...(pace === undefined
      ? []
      : [
          {
            provide: ASSISTANT_AGENT,
            useFactory: () => new ReplayAgent(recordings, capabilitySetKey(loaded), pace),
          },
        ]),
  ]);
}

async function render(
  loaded: readonly RemoteName[],
  agentProviders: readonly (Provider | EnvironmentProviders)[],
): Promise<ComponentFixture<ChatPage>> {
  const statuses = remoteStatuses(loaded);
  TestBed.configureTestingModule({
    providers: [
      provideAgentCapabilities(loadedCapabilities(statuses)),
      provideCapabilityStatus(statuses),
      provideReserveHandler(),
      provideOfflineMap(),
      { provide: PAGE_SEARCH, useValue: '' },
      ...agentProviders,
    ],
  });
  const fixture = TestBed.createComponent(ChatPage);
  await fixture.whenStable();
  return fixture;
}

export function host(fixture: ComponentFixture<ChatPage>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

export function promptButtons(fixture: ComponentFixture<ChatPage>): HTMLButtonElement[] {
  return [...host(fixture).querySelectorAll<HTMLButtonElement>('.cf-prompts button')];
}

export function clickPrompt(fixture: ComponentFixture<ChatPage>, index: number): void {
  promptButtons(fixture)[index].click();
}

export function surfaces(fixture: ComponentFixture<ChatPage>): number {
  return host(fixture).querySelectorAll('a2ui-v09-surface').length;
}

export function markersOf(fixture: ComponentFixture<ChatPage>): HTMLElement[] {
  return [...host(fixture).querySelectorAll<HTMLElement>('a2ui-v09-surface app-map .cf-marker')];
}

export function timelineMarkers(fixture: ComponentFixture<ChatPage>): HTMLElement[] {
  return [
    ...host(fixture).querySelectorAll<HTMLElement>('a2ui-v09-surface app-timeline .cf-marker'),
  ];
}

/** The gauge readings of every surface in the transcript, in message order. */
export function gaugeValues(fixture: ComponentFixture<ChatPage>): string[] {
  return [...host(fixture).querySelectorAll('a2ui-v09-surface .cf-gauge-value')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

export function reserveButtons(fixture: ComponentFixture<ChatPage>): HTMLButtonElement[] {
  return [
    ...host(fixture).querySelectorAll<HTMLButtonElement>('a2ui-v09-surface a2ui-v09-button button'),
  ];
}

export function widgetText(fixture: ComponentFixture<ChatPage>): string {
  return host(fixture).querySelector('copilot-chat app-message-widget')?.textContent ?? '';
}

export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

import {
  DestroyRef,
  inject,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { ConferenceStore } from '../domain/conference.store';
import { A2uiActionBus } from './action-bus';
import { isRecord, LIST_PATH, SELECTION_PATH } from './surface-host-rules';

/**
 * The reserve click path without the model: a `reserve` action records the reservation in the
 * store and patches `remaining` at the conference's two fixed homes in every live surface.
 * An environment initializer, not a service: nothing would ever inject the handler, and a root
 * service is only created on first injection. Subscribed for the app's lifetime, shared by chat
 * and playground.
 */
export function provideReserveHandler(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const store = inject(ConferenceStore);
    const renderer = inject(A2uiRendererService);
    const unsubscribe = inject(A2uiActionBus).subscribe((action) =>
      handleReserve(action, store, renderer),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  });
}

function handleReserve(
  action: A2uiClientAction,
  store: ConferenceStore,
  renderer: A2uiRendererService,
): void {
  if (action.name !== 'reserve') return;
  const id: unknown = action.context['id'];
  if (typeof id !== 'string') return warnIgnored(action, id);
  const remaining = store.reserve(id);
  if (remaining === undefined) return warnIgnored(action, id);

  const messages = remainingUpdates(renderer, id, remaining);
  if (messages.length > 0) renderer.processMessages(messages);
}

/**
 * One write per home of the conference, in every live surface — not only the clicked one: the
 * count is shared state the browser owns, never part of an answer's record (the model does not see
 * it), so every surface showing it shows the same number. Written through the renderer, never
 * through a data model directly.
 */
function remainingUpdates(
  renderer: A2uiRendererService,
  id: string,
  remaining: number,
): A2uiMessage[] {
  const messages: A2uiMessage[] = [];
  for (const [surfaceId, surface] of renderer.surfaceGroup.surfacesMap) {
    for (const path of remainingPathsOf(surface.dataModel, id)) {
      messages.push({ version: 'v0.9', updateDataModel: { surfaceId, path, value: remaining } });
    }
  }
  return messages;
}

/** What the handler needs of a surface's data model. */
interface PathReader {
  get(path: string): unknown;
}

/**
 * A conference has two homes in a surface, both names fixed by the host rules: its entry in the
 * client-mounted list and, when it is the selection, the selection itself. Nothing else is
 * touched, whatever else carries the same id.
 */
function remainingPathsOf(dataModel: PathReader, id: string): string[] {
  const paths: string[] = [];
  const list = dataModel.get(LIST_PATH);
  if (Array.isArray(list)) {
    const index = list.findIndex((entry) => hasId(entry, id));
    if (index >= 0) paths.push(`${LIST_PATH}/${index}/remaining`);
  }
  if (hasId(dataModel.get(SELECTION_PATH), id)) paths.push(`${SELECTION_PATH}/remaining`);
  return paths;
}

function warnIgnored(action: A2uiClientAction, id: unknown): void {
  console.warn('[reserve] Ignored: no conference with this id.', { id, surfaceId: action.surfaceId });
}

function hasId(value: unknown, id: string): boolean {
  return isRecord(value) && value['id'] === id;
}

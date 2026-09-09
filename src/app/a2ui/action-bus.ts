import { Injectable } from '@angular/core';
import type { A2uiClientAction } from '@a2ui/web_core/v0_9';

export type A2uiActionListener = (action: A2uiClientAction) => void;

/**
 * Fans surface actions out to registered listeners. The renderer's action
 * handler is fixed at provide time; this bus lets later features (reserve
 * handler, chat page) subscribe without touching the provider setup.
 */
@Injectable({ providedIn: 'root' })
export class A2uiActionBus {
  private readonly listeners = new Set<A2uiActionListener>();

  dispatch(action: A2uiClientAction): void {
    for (const listener of this.listeners) {
      listener(action);
    }
  }

  /** Returns an unsubscribe function. */
  subscribe(listener: A2uiActionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

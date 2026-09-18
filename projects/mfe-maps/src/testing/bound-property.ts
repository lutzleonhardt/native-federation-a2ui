import { WritableSignal, signal } from '@angular/core';
import { vi, type Mock } from 'vitest';
import type { BoundProperty } from '@a2ui/angular/v0_9';

export interface FakeBoundProperty<T> extends BoundProperty<T> {
  readonly value: WritableSignal<T>;
  readonly onUpdate: Mock<(newValue: T) => void>;
}

/**
 * Vitest stand-in for the renderer's BoundProperty; the official
 * `createBoundProperty` from @a2ui/angular/v0_9/testing returns a Jasmine spy.
 */
export function boundProperty<T>(value: T): FakeBoundProperty<T> {
  return { value: signal(value), raw: value, onUpdate: vi.fn() };
}

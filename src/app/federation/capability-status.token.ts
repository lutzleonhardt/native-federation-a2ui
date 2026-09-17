import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { CapabilityStatus } from './capability-status';

/** Every manifest remote's outcome, in manifest order; the capability panel renders exactly this. */
export const CAPABILITY_STATUS = new InjectionToken<readonly CapabilityStatus[]>(
  'CAPABILITY_STATUS',
);

export function provideCapabilityStatus(
  statuses: readonly CapabilityStatus[],
): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CAPABILITY_STATUS, useValue: statuses }]);
}

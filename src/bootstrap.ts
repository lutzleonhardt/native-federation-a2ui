import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { createAppConfig } from './app/app.config';
import { mapsCapability } from './app/capabilities/maps';
import { loadedCapabilities, type CapabilityStatus } from './app/federation/capability-status';

/** Phase two of the bootstrap: the first module that may import Angular, loaded once the import map exists. */
export function bootstrap(remotes: readonly CapabilityStatus[]) {
  // Remotes first: manifest order decides who wins a duplicate name. Maps stays in
  // this list until it has a remote of its own.
  const capabilities = [...loadedCapabilities(remotes), mapsCapability];
  return bootstrapApplication(App, createAppConfig(capabilities, remotes));
}

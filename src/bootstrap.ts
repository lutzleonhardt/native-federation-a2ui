import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { createAppConfig } from './app/app.config';
import type { CapabilityStatus } from './app/federation/capability-status';

/** Phase two of the bootstrap: the first module that may import Angular, loaded once the import map exists. */
export function bootstrap(remotes: readonly CapabilityStatus[]) {
  return bootstrapApplication(App, createAppConfig(remotes));
}

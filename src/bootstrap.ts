import { bootstrapApplication } from '@angular/platform-browser';
import type { AgentCapability } from '../shared/capabilities/agent-capability';
import { App } from './app/app';
import { createAppConfig } from './app/app.config';
import { chartsCapability } from './app/capabilities/charts';
import { mapsCapability } from './app/capabilities/maps';

/** Phase two of the bootstrap: the first module that may import Angular, loaded once the import map exists. */
export function bootstrap(remotes: readonly AgentCapability[]) {
  // Remotes first: manifest order decides who wins a duplicate name. The two local
  // capabilities stay in this list until each has a remote of its own.
  return bootstrapApplication(App, createAppConfig([...remotes, chartsCapability, mapsCapability]));
}

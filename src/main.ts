import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { createAppConfig } from './app/app.config';
import { chartsCapability } from './app/capabilities/charts';
import { mapsCapability } from './app/capabilities/maps';

// Local capabilities until the federation host loads them from the manifest.
bootstrapApplication(App, createAppConfig([chartsCapability, mapsCapability])).catch((err) =>
  console.error(err),
);

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { createAssistantCatalog } from './a2ui/assistant-catalog';
import { provideA2uiCatalog } from './a2ui/provide-a2ui-catalog';
import { routes } from './app.routes';
import { chartsFragment } from './capabilities/charts';
import { mapsFragment } from './capabilities/maps';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideA2uiCatalog(createAssistantCatalog([chartsFragment, mapsFragment])),
  ],
};

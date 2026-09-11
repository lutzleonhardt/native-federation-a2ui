import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { createAssistantCatalog } from './a2ui/assistant-catalog';
import { ASSISTANT_FRAGMENTS } from './a2ui/assistant-fragments';
import { provideA2uiCatalog } from './a2ui/provide-a2ui-catalog';
import { provideAssistantAgent } from './agent/assistant-agent.token';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideA2uiCatalog(createAssistantCatalog(ASSISTANT_FRAGMENTS)),
    provideAssistantAgent(),
  ],
};

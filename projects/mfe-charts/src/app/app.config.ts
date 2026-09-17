import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideA2Ui, provideMarkdownRenderer } from '@a2ui/angular/v0_9';
import { renderMarkdown } from '@a2ui/markdown-it';
import { createChartsCatalog } from './charts-catalog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideA2Ui({
      catalogs: [createChartsCatalog()],
      actionHandler: (action) => console.log('[mfe-charts] action', action),
    }),
    // The basic `Text` component injects the markdown renderer unconditionally; the static
    // import keeps `@a2ui/markdown-it` in the federated build (see the shell's provide-a2ui-catalog).
    provideMarkdownRenderer((markdown) => renderMarkdown(String(markdown))),
  ],
};

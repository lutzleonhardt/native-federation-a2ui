import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { AngularCatalog, provideA2Ui, provideMarkdownRenderer } from '@a2ui/angular/v0_9';
import { renderMarkdown } from '@a2ui/markdown-it';
import { A2uiActionBus } from './action-bus';

/**
 * Provides the renderer with the given catalog and routes surface actions to
 * the bus. The markdown renderer rides along because the basic `Text`
 * component injects it unconditionally. `renderMarkdown` is imported statically:
 * the default renderer's dynamic `import('@a2ui/markdown-it')` has no import-map
 * entry in a federated build (unused-dependency pruning) and silently falls
 * back to plain text.
 */
export function provideA2uiCatalog(catalog: AngularCatalog): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideA2Ui(() => {
      const bus = inject(A2uiActionBus);
      return {
        catalogs: [catalog],
        actionHandler: (action) => bus.dispatch(action),
      };
    }),
    // Only the text is forwarded (the two packages type the options differently, and no caller
    // passes any), coerced to a string: a function binding such as `daysUntil` hands the basic
    // `Text` a number, and markdown-it rejects anything but strings.
    provideMarkdownRenderer((markdown) => renderMarkdown(String(markdown))),
  ]);
}

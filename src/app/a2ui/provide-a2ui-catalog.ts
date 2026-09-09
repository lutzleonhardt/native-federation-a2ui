import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { AngularCatalog, provideA2Ui, provideMarkdownRenderer } from '@a2ui/angular/v0_9';
import { A2uiActionBus } from './action-bus';

/**
 * Provides the renderer with the given catalog and routes surface actions to
 * the bus. The markdown renderer rides along because the basic `Text`
 * component injects it unconditionally.
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
    provideMarkdownRenderer(),
  ]);
}

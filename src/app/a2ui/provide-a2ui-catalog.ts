import { EnvironmentProviders, inject } from '@angular/core';
import { AngularCatalog, provideA2Ui } from '@a2ui/angular/v0_9';
import { A2uiActionBus } from './action-bus';

/** Provides the renderer with the given catalog and routes surface actions to the bus. */
export function provideA2uiCatalog(catalog: AngularCatalog): EnvironmentProviders {
  return provideA2Ui(() => {
    const bus = inject(A2uiActionBus);
    return {
      catalogs: [catalog],
      actionHandler: (action) => bus.dispatch(action),
    };
  });
}

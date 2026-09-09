import { Injector } from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular/v0_9';
import { DataContext, type Action } from '@a2ui/web_core/v0_9';

/**
 * Mirrors the basic Button's dispatch path: resolve the action's context
 * against the component's data scope, then hand it to the surface, which
 * emits an `A2uiClientAction` to the registered action handler.
 *
 * The renderer service is resolved lazily through the injector: constructing
 * it needs the provideA2Ui config, which prop-fake component tests run without.
 */
export function dispatchSurfaceAction(
  injector: Injector,
  surfaceId: string,
  dataContextPath: string,
  componentId: string,
  action: Action,
): void {
  const surface = injector.get(A2uiRendererService).surfaceGroup.getSurface(surfaceId);
  if (surface === undefined) return;
  const resolved = new DataContext(surface, dataContextPath).resolveAction(action);
  void surface.dispatchAction(resolved, componentId);
}

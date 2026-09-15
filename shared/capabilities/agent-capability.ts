import type { Type } from '@angular/core';
import type { AssistantFunction } from './catalog-function';
import {
  createCustomComponent,
  type ComponentMeta,
  type CustomComponent,
} from './custom-component';

/**
 * One capability's model-facing vocabulary, keyed by component name so that the
 * announced set and the Angular implementations are closed over the same union.
 */
export interface CapabilityVocabulary<Names extends string> {
  readonly components: Record<Names, ComponentMeta>;
  readonly functions: readonly AssistantFunction[];
}

/** Every announced component needs an implementation; a missing or unknown name is a compile error. */
export type ComponentImplementations<Names extends string> = Record<Names, Type<unknown>>;

/**
 * What one team contributes: the model-facing vocabulary and the Angular
 * components that implement it.
 */
export interface AgentCapability {
  readonly name: string; // 'charts'
  readonly vocabulary: CapabilityVocabulary<string>; // framework-free half
  readonly components: ComponentImplementations<string>; // the Angular half
}

/** What one capability area (charts, maps, …) contributes to the assistant catalog. */
export interface CatalogFragment {
  readonly components: readonly CustomComponent[];
  readonly functions: readonly AssistantFunction[];
}

/** Joins a capability's vocabulary with its Angular implementations. */
export function toFragment(
  vocabulary: CapabilityVocabulary<string>,
  implementations: ComponentImplementations<string>,
): CatalogFragment {
  return {
    components: Object.entries(vocabulary.components).map(([name, meta]) =>
      createCustomComponent({ ...meta, component: implementations[name] }),
    ),
    functions: vocabulary.functions,
  };
}

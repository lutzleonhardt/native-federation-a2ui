import type { Type } from '@angular/core';
import type { AngularComponentImplementation } from '@a2ui/angular/v0_9';
import type { z } from 'zod/v3';
import type { AssistantFunction, CatalogFragment } from './assistant-catalog';

/**
 * The model-facing half of a component: name, prompt description, and prop
 * schema. Framework-free so the Node eval harness can import it without
 * Angular; the Angular component joins in `createCustomComponent`.
 */
export interface ComponentMeta<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  readonly name: string;
  readonly description: string;
  readonly schema: Schema;
}

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

/** An assistant-catalog component: renderer implementation plus prompt metadata. */
export interface CustomComponent extends AngularComponentImplementation {
  readonly description: string;
}

/**
 * The `schema` cast is the deliberate bridge between zod universes: our
 * schemas live on the root `zod/v3` line while the a2ui packages type theirs
 * via nested zod 3 copies. The runtime API is identical, but letting tsc
 * compare the copies structurally exhausts a 4 GB heap. Every zod value that
 * crosses into a2ui-typed code goes through this cast or the one in
 * `createCatalogFunction` — never compare the universes anywhere else.
 *
 * `component` is widened to Type<unknown>: the host binds props/surfaceId/
 * componentId/dataContextPath dynamically, and a precisely typed props input
 * (e.g. InputSignal<GaugeProps>) is not structurally a
 * Signal<Record<string, unknown>>. The renderer specs cover the contract.
 */
export function createCustomComponent(
  config: ComponentMeta & { component: Type<unknown> },
): CustomComponent {
  return {
    name: config.name,
    description: config.description,
    schema: config.schema as unknown as AngularComponentImplementation['schema'],
    component: config.component as AngularComponentImplementation['component'],
  };
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

import type { Context } from '@ag-ui/core';
import { BASIC_COMPONENTS, BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CATALOG_CONTEXT_DESCRIPTION } from '../../../shared/agent-contract';
import { chartsVocabulary } from '../capabilities/charts/vocabulary';
import { mapsVocabulary } from '../capabilities/maps/vocabulary';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog-id';

/**
 * Framework-free on purpose: shell and eval harness must send the model the
 * same vocabulary (XC-04), and `@a2ui/angular` does not load under Node. The
 * basic names come from `@a2ui/web_core`, the Node-importable twin of the
 * Angular basic catalog. Nothing here may import `@a2ui/angular`, directly or
 * through `assistant-catalog.ts`.
 */

/** The model-facing half of a component: everything except the Angular implementation. */
interface ComponentVocabulary {
  readonly name: string;
  readonly description: string;
  readonly schema: unknown;
}

interface FunctionVocabulary extends ComponentVocabulary {
  readonly returnType: string;
}

/** The same per-capability lists the renderer pairs with Angular components in `assistant-fragments.ts`. */
const ASSISTANT_VOCABULARY: {
  readonly components: readonly ComponentVocabulary[];
  readonly functions: readonly FunctionVocabulary[];
} = {
  components: [
    ...Object.values(chartsVocabulary.components),
    ...Object.values(mapsVocabulary.components),
  ],
  functions: [...chartsVocabulary.functions, ...mapsVocabulary.functions],
};

/**
 * Serializes the custom vocabulary for the model's context. Unlike the book's
 * variant this includes the functions — the model only uses `daysUntil` and
 * `distance` if it knows they exist.
 */
export function catalogToContextEntry(): Context {
  const payload = {
    catalogId: ASSISTANT_CATALOG_ID,
    components: Object.fromEntries(
      withoutReservedNames(ASSISTANT_VOCABULARY.components, BASIC_COMPONENTS).map((component) => [
        component.name,
        { description: component.description, schema: toJsonSchema(component.schema) },
      ]),
    ),
    functions: Object.fromEntries(
      withoutReservedNames(ASSISTANT_VOCABULARY.functions, BASIC_FUNCTIONS).map((fn) => [
        fn.name,
        { description: fn.description, args: toJsonSchema(fn.schema), returnType: fn.returnType },
      ]),
    ),
  };
  return { description: CATALOG_CONTEXT_DESCRIPTION, value: JSON.stringify(payload) };
}

/** Names the model already knows from the basic catalog; announcing them twice invites collisions. */
function withoutReservedNames<T extends { readonly name: string }>(
  items: readonly T[],
  reserved: readonly { readonly name: string }[],
): readonly T[] {
  const taken = new Set(reserved.map((entry) => entry.name));
  return items.filter((item) => !taken.has(item.name));
}

/** The cast re-crosses the zod-universe bridge (see `createCustomComponent`). */
function toJsonSchema(schema: unknown): object {
  const jsonSchema = zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0]);
  delete jsonSchema.$schema;
  return jsonSchema;
}

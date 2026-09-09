import type { Context } from '@ag-ui/core';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ASSISTANT_CATALOG_ID, CatalogFragment, mergeFragments } from './assistant-catalog';

/**
 * Serializes the custom vocabulary for the model's context. Unlike the book's
 * variant this includes the functions — the model only uses `daysUntil` and
 * `distance` if it knows they exist.
 */
export function catalogToContextEntry(fragments: readonly CatalogFragment[]): Context {
  const { components, functions } = mergeFragments(fragments, { warn: false });
  const payload = {
    catalogId: ASSISTANT_CATALOG_ID,
    components: Object.fromEntries(
      components.map((component) => [
        component.name,
        { description: component.description, schema: toJsonSchema(component.schema) },
      ]),
    ),
    functions: Object.fromEntries(
      functions.map((fn) => [
        fn.name,
        { description: fn.description, args: toJsonSchema(fn.schema), returnType: fn.returnType },
      ]),
    ),
  };
  return { description: 'A2UI Custom Catalog', value: JSON.stringify(payload) };
}

/** The cast re-crosses the zod-universe bridge (see `createCustomComponent`). */
function toJsonSchema(schema: unknown): object {
  const jsonSchema = zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0]);
  delete jsonSchema.$schema;
  return jsonSchema;
}

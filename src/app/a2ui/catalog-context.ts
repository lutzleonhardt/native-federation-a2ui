import type { Context } from '@ag-ui/core';
import { BASIC_COMPONENTS, BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CATALOG_CONTEXT_DESCRIPTION } from '../../../shared/agent-contract';
import type { CapabilityVocabulary } from '../../../shared/capabilities/agent-capability';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog-id';

/**
 * Framework-free on purpose: shell and eval harness must send the model the
 * same vocabulary (XC-04), and `@a2ui/angular` does not load under Node. The
 * basic names come from `@a2ui/web_core`, the Node-importable twin of the
 * Angular basic catalog. Nothing here may import `@a2ui/angular`, directly or
 * through `assistant-catalog.ts`.
 */

/**
 * Serializes the custom vocabulary for the model's context. Takes the
 * framework-free half only: the shell passes what it loaded, the eval harness
 * the `vocabulary.ts` files, since an `AgentCapability` cannot be built under
 * Node. Includes the functions — the model only uses `daysUntil` if it knows it exists.
 */
export function catalogToContextEntry(
  vocabularies: readonly CapabilityVocabulary<string>[],
): Context {
  const components = vocabularies.flatMap((vocabulary) => Object.values(vocabulary.components));
  const functions = vocabularies.flatMap((vocabulary) => vocabulary.functions);
  const payload = {
    catalogId: ASSISTANT_CATALOG_ID,
    components: Object.fromEntries(
      uniqueByName(components, BASIC_COMPONENTS).map((component) => [
        component.name,
        { description: component.description, schema: toJsonSchema(component.schema) },
      ]),
    ),
    functions: Object.fromEntries(
      uniqueByName(functions, BASIC_FUNCTIONS).map((fn) => [
        fn.name,
        { description: fn.description, args: toJsonSchema(fn.schema), returnType: fn.returnType },
      ]),
    ),
    // Prop names only: the schemas would add ~82 000 characters; see architecture.md "Prompt and vocabulary".
    basic: Object.fromEntries(
      BASIC_COMPONENTS.map((component) => [component.name, propNames(component.schema)]),
    ),
  };
  return { description: CATALOG_CONTEXT_DESCRIPTION, value: JSON.stringify(payload) };
}

/** A zod object's keys; every basic component schema is an object, any other shape lists nothing. */
function propNames(schema: unknown): string[] {
  const shape = (schema as { shape?: Record<string, unknown> }).shape;
  return shape === undefined ? [] : Object.keys(shape);
}

/**
 * One entry per name, first registration wins; names the basic catalog owns
 * are dropped too. Same rule as `uniqueByName` in `assistant-catalog.ts`, so
 * the announced schema is the rendered one.
 */
function uniqueByName<T extends { readonly name: string }>(
  items: readonly T[],
  reserved: readonly { readonly name: string }[],
): readonly T[] {
  const taken = new Set(reserved.map((entry) => entry.name));
  return items.filter((item) => {
    if (taken.has(item.name)) return false;
    taken.add(item.name);
    return true;
  });
}

/**
 * Every alternative is written out: the default `$ref` strategy points a
 * repeated `path`/`call` shape at `#/properties/<first prop>/…`, a pointer
 * that dangles once the schema is nested into the payload. The cast
 * re-crosses the zod-universe bridge (see `createCustomComponent`).
 */
function toJsonSchema(schema: unknown): object {
  const jsonSchema = zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0], {
    $refStrategy: 'none',
  });
  delete jsonSchema.$schema;
  return jsonSchema;
}

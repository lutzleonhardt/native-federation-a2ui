import type { A2uiReturnType, FunctionImplementation } from '@a2ui/web_core/v0_9';
import type { z } from 'zod/v3';

/** An assistant-catalog function: implementation plus prompt metadata. */
export interface AssistantFunction extends FunctionImplementation {
  readonly description: string;
}

export interface CatalogFunctionApi<Schema extends z.ZodTypeAny> {
  readonly name: string;
  readonly description: string;
  readonly returnType: A2uiReturnType;
  readonly schema: Schema;
}

/**
 * Builds an assistant-catalog function; replaces web_core's
 * `createFunctionImplementation` (a plain object builder) to add the prompt
 * description and the zod-universe bridge cast (see `createCustomComponent`).
 */
export function createCatalogFunction<Schema extends z.ZodTypeAny>(
  api: CatalogFunctionApi<Schema>,
  execute: (args: z.infer<Schema>) => unknown,
): AssistantFunction {
  return {
    name: api.name,
    description: api.description,
    returnType: api.returnType,
    schema: api.schema as unknown as FunctionImplementation['schema'],
    execute: (args) => execute(args as z.infer<Schema>),
  };
}

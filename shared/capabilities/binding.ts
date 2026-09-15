import { z } from 'zod/v3';

/**
 * Catalog schemas stay on the zod v3 line: the renderer validates them with
 * web_core's zod 3, and zod-to-json-schema serializes only v3 schemas.
 */
const dataBindingSchema = z.object({ path: z.string() });

/** A component prop: a literal value or a data-model binding like `{ path: '/selectedConf/remaining' }`. */
export function binding<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.union([schema, dataBindingSchema]);
}

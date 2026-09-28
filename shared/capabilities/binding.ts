import { z } from 'zod/v3';

/**
 * Catalog schemas stay on the zod v3 line: the renderer validates them with
 * web_core's zod 3, and zod-to-json-schema serializes only v3 schemas.
 */
const dataBindingSchema = z.object({ path: z.string() });

/**
 * The shape of web_core's `FunctionCallSchema`, defined here rather than
 * imported: a union across zod copies breaks parsing at runtime.
 */
const functionCallSchema = z.object({
  call: z.string().describe('The name of a catalog function.'),
  args: z
    .record(z.unknown())
    .describe('Its arguments; each may itself be a literal, a path or a call.'),
  returnType: z.enum(['string', 'number', 'boolean', 'array', 'object', 'any', 'void']).optional(),
});

/**
 * A component prop: a literal value, a data-model binding like
 * `{ path: '/selectedConf/remaining' }`, or a catalog function call like
 * `{ call: 'distance', args: { a: { path: '/me' }, b: { path: '/selectedConf' } } }`.
 */
export function binding<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.union([schema, dataBindingSchema, functionCallSchema]);
}

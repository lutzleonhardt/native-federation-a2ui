import { ActionSchema } from '@a2ui/web_core/v0_9';
import type { z } from 'zod/v3';

/**
 * Reverse direction of the zod-universe bridge (canonical comment in
 * `custom-component.ts`): web_core's ActionSchema re-typed into our `zod/v3`
 * universe so catalog schemas can embed it without tsc comparing the copies.
 */
export const actionSchema = ActionSchema as unknown as z.ZodTypeAny;

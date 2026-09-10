import { z } from 'zod';

/**
 * The tool schema describes the A2UI protocol envelope — message forms and
 * their required fields — so the model gets structure from the function
 * schema itself, not only from the prompt. Component props stay open (they
 * belong to the loaded catalog), and the handler still validates the full
 * list against the authoritative `A2uiMessageListWrapperSchema`.
 */
const createSurfaceMessageSchema = z.object({
  version: z.literal('v0.9'),
  createSurface: z.object({
    surfaceId: z.string().describe('Fresh id for this surface; never reuse an earlier one.'),
    catalogId: z.string(),
  }),
});

const updateComponentsMessageSchema = z.object({
  version: z.literal('v0.9'),
  updateComponents: z.object({
    surfaceId: z.string(),
    components: z
      .array(
        z
          .looseObject({ id: z.string(), component: z.string() })
          .describe('One component; further props per the catalog. Bind data as { "path": "/…" }.'),
      )
      .describe('Flat list; nest via child/children ids.'),
  }),
});

const updateDataModelMessageSchema = z.object({
  version: z.literal('v0.9'),
  updateDataModel: z.object({
    surfaceId: z.string(),
    path: z.string().describe('Absolute path like /title. Never write client-owned paths.'),
    value: z.unknown(),
  }),
});

export const renderSurfaceArgsSchema = z.object({
  messages: z
    .array(
      z.union([
        createSurfaceMessageSchema,
        updateComponentsMessageSchema,
        updateDataModelMessageSchema,
      ]),
    )
    .describe(
      'Exactly one createSurface, then updateComponents; updateDataModel only for surface-local extras.',
    ),
});

export type RenderSurfaceArgs = z.infer<typeof renderSurfaceArgsSchema>;

/** Framework-free: the Angular registration and the Node eval harness share it. */
export const renderSurfaceDefinition = {
  name: 'renderSurface',
  description:
    'Render an interactive A2UI surface from a list of A2UI messages. ' +
    "/filteredConfs holds the latest search result; /selectedConf holds this surface's selection. " +
    'Bind /filteredConfs, /me, /selectedConf, /byMonth, /byTopic instead of writing them: ' +
    'the client mounts their values after your messages are applied.',
  parameters: renderSurfaceArgsSchema,
} as const;

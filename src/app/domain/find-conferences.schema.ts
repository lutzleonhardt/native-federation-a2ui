import { z } from 'zod';

/** Runtime counterpart of `ConferenceTopic`; also used to validate the data set. */
export const conferenceTopicSchema = z.enum(['angular', 'dotnet', 'web', 'ai', 'cloud']);

/**
 * Argument contract of the `findConferences` client tool. The model emits these
 * arguments as JSON and the tool runs in the browser, so they are untrusted input
 * and get parsed at the tool boundary. The `describe` texts are not decoration:
 * they become the tool description the model reads.
 * Framework-free so the tool registration and the Node eval harness share one definition.
 */
export const findConferencesArgsSchema = z.object({
  topic: conferenceTopicSchema.optional().describe('Restrict to conferences on this topic.'),
  withinDays: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Only conferences starting within this many days from today.'),
  nearKm: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Only conferences within this radius of the user's location, in kilometres."),
  limit: z.number().int().positive().optional().describe('Maximum number of conferences.'),
  groupBy: z
    .enum(['month', 'topic'])
    .optional()
    .describe('Additionally return counts grouped by month or by topic.'),
});

export type FindConferencesArgs = z.infer<typeof findConferencesArgsSchema>;

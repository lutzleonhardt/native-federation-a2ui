import { z } from 'zod';

export const messageWidgetArgsSchema = z.object({
  text: z.string().describe('The message to show. Markdown is allowed.'),
});

export type MessageWidgetArgs = z.infer<typeof messageWidgetArgsSchema>;

/** Framework-free: the Angular registration and the Node eval harness share it. */
export const messageWidgetDefinition = {
  name: 'messageWidget',
  description: 'Show a text answer to the user when no surface is needed.',
  parameters: messageWidgetArgsSchema,
} as const;

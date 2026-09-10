import type { FrontendToolSpec } from '../create-frontend-tool';
import { MessageWidgetComponent } from './message-widget.component';
import { messageWidgetDefinition, type MessageWidgetArgs } from './message-widget.definition';

export const messageWidgetTool: FrontendToolSpec<MessageWidgetArgs> = {
  ...messageWidgetDefinition,
  followUp: false,
  component: MessageWidgetComponent,
  handler: async () => ({ ok: true }),
};

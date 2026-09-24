import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MarkdownRenderer } from '@a2ui/angular/v0_9';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import type { MessageWidgetArgs } from './message-widget.definition';

@Component({
  selector: 'app-message-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-widget.component.html',
  styleUrl: './message-widget.component.css',
  // The stylesheet must reach the innerHTML markdown (see there).
  encapsulation: ViewEncapsulation.None,
})
export class MessageWidgetComponent implements ToolRenderer<MessageWidgetArgs> {
  readonly toolCall = input.required<AngularToolCall<MessageWidgetArgs>>();

  private readonly markdown = inject(MarkdownRenderer);
  protected readonly html = signal('');
  private renderRequestId = 0;

  constructor() {
    // Mirrors the basic `Text` component: rendering is async and the args
    // stream, so the request id drops out-of-order resolutions.
    effect(() => {
      const text = this.toolCall().args.text ?? '';
      const requestId = ++this.renderRequestId;
      void this.markdown.render(text).then((rendered) => {
        if (requestId === this.renderRequestId) this.html.set(rendered);
      });
    });
  }
}

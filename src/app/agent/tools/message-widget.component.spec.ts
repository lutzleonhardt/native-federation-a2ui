import { TestBed } from '@angular/core/testing';
import { provideMarkdownRenderer } from '@a2ui/angular/v0_9';
import type { AngularToolCall } from '@copilotkit/angular';
import { describe, expect, it, vi } from 'vitest';
import { bindFrontendTool } from '../create-frontend-tool';
import { MessageWidgetComponent } from './message-widget.component';
import type { MessageWidgetArgs } from './message-widget.definition';
import { messageWidgetTool } from './message-widget.tool';

function createWidget(renderFn?: (markdown: string) => Promise<string>) {
  TestBed.configureTestingModule({ providers: [provideMarkdownRenderer(renderFn)] });
  return TestBed.createComponent(MessageWidgetComponent);
}

function call(
  text: string,
  status: 'in-progress' | 'complete' = 'complete',
): AngularToolCall<MessageWidgetArgs> {
  if (status === 'in-progress') return { args: { text }, status, result: undefined };
  return { args: { text }, status, result: JSON.stringify({ ok: true }) };
}

describe('MessageWidgetComponent', () => {
  it('renders the text as markdown', async () => {
    const fixture = createWidget();
    fixture.componentRef.setInput('toolCall', call('Hello **conference**'));
    await fixture.whenStable();

    await vi.waitFor(() => {
      const html = (fixture.nativeElement as HTMLElement).innerHTML;
      expect(html).toContain('<strong>conference</strong>');
    });
  });

  it('shows the latest text even when an earlier render resolves later', async () => {
    const resolvers = new Map<string, (html: string) => void>();
    const fixture = createWidget(
      (markdown) => new Promise<string>((resolve) => resolvers.set(markdown, resolve)),
    );

    fixture.componentRef.setInput('toolCall', call('Hal', 'in-progress'));
    await fixture.whenStable();
    fixture.componentRef.setInput('toolCall', call('Hello'));
    await fixture.whenStable();

    // The streaming-era render finishes after the final one.
    resolvers.get('Hello')?.('<p>FINAL</p>');
    resolvers.get('Hal')?.('<p>STALE</p>');

    await vi.waitFor(() => {
      const html = (fixture.nativeElement as HTMLElement).innerHTML;
      expect(html).toContain('FINAL');
      expect(html).not.toContain('STALE');
    });
  });

  it('ends the turn: the bound tool advertises it and the handler reports ok', async () => {
    const bound = bindFrontendTool(messageWidgetTool);

    expect(bound.followUp).toBe(false);
    expect(bound.description).toContain('Calling this tool ends your turn.');
    await expect(bound.handler({ text: 'Hi' }, { toolCall: { id: 'tc-msg' } })).resolves.toEqual({
      ok: true,
    });
  });
});

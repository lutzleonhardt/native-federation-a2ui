import type { AssistantMessage, Message, ToolMessage, UserMessage } from '@ag-ui/core';
import { describe, expect, it } from 'vitest';
import { recordedTurn } from './recorder';

function user(content: string): UserMessage {
  return { id: `user-${content}`, role: 'user', content };
}

/** One assistant message; `name/args` pairs as the model's call list, ids by position. */
function assistant(id: string, ...calls: readonly [string, unknown][]): AssistantMessage {
  return {
    id,
    role: 'assistant',
    toolCalls: calls.map(([name, args], index) => ({
      id: `${id}-${index}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    })),
  };
}

function result(toolCallId: string, content: unknown): ToolMessage {
  return { id: `result-${toolCallId}`, role: 'tool', toolCallId, content: JSON.stringify(content) };
}

describe('recordedTurn', () => {
  it('T4.5-AC-04 keeps one run per assistant message with parsed args when every call was accepted', () => {
    const messages: Message[] = [
      user('Which conferences?'),
      assistant('m1', ['findConferences', { topic: 'angular' }]),
      result('m1-0', { ok: true, count: 3 }),
      assistant('m2', ['messageWidget', { text: 'Three.' }], ['renderSurface', { messages: [] }]),
      result('m2-0', { ok: true }),
      result('m2-1', { ok: true, surfaceId: 's' }),
    ];
    expect(recordedTurn(messages)).toEqual({
      prompt: 'Which conferences?',
      runs: [
        [{ name: 'findConferences', args: { topic: 'angular' } }],
        [
          { name: 'messageWidget', args: { text: 'Three.' } },
          { name: 'renderSurface', args: { messages: [] } },
        ],
      ],
    });
  });

  it('T4.5-AC-04 drops a run with a refused, unanswered or unparsable call, and a text-only message', () => {
    const messages: Message[] = [
      user('Show me'),
      assistant('refused', ['renderSurface', { messages: [] }]),
      result('refused-0', { ok: false, code: 'catalog', result: 'Unknown component' }),
      assistant('unanswered', ['renderSurface', { messages: [] }]),
      { id: 'text', role: 'assistant', content: 'Here you go.' },
      {
        id: 'garbled',
        role: 'assistant',
        toolCalls: [
          {
            id: 'garbled-0',
            type: 'function',
            function: { name: 'renderSurface', arguments: '{' },
          },
        ],
      },
      result('garbled-0', { ok: true }),
      assistant('half', ['messageWidget', { text: 'One.' }], ['renderSurface', { messages: [] }]),
      result('half-0', { ok: true }),
      result('half-1', { ok: false, code: 'invalid_messages' }),
      assistant('kept', ['renderSurface', { messages: [] }]),
      result('kept-0', { ok: true, surfaceId: 'kept' }),
    ];
    expect(recordedTurn(messages)?.runs).toEqual([
      [{ name: 'renderSurface', args: { messages: [] } }],
    ]);
  });

  it('records the last user message only', () => {
    const messages: Message[] = [
      user('First'),
      assistant('a', ['messageWidget', { text: 'One.' }]),
      result('a-0', { ok: true }),
      user('Second'),
      assistant('b', ['messageWidget', { text: 'Two.' }]),
      result('b-0', { ok: true }),
    ];
    expect(recordedTurn(messages)).toEqual({
      prompt: 'Second',
      runs: [[{ name: 'messageWidget', args: { text: 'Two.' } }]],
    });
  });

  it('T4.5-AC-04 is undefined while the last call is refused: the correction is pending or the shell gave up', () => {
    const search = [
      user('Show me'),
      assistant('s', ['findConferences', {}]),
      result('s-0', { ok: true }),
    ];
    const refused = [assistant('r', ['renderSurface', {}]), result('r-0', { ok: false })];
    expect(recordedTurn([...search, ...refused])).toBeUndefined();
    expect(recordedTurn([...search, ...refused, ...refused])).toBeUndefined();
    const corrected = [assistant('c', ['renderSurface', {}]), result('c-0', { ok: true })];
    expect(recordedTurn([...search, ...refused, ...corrected])?.runs).toHaveLength(2);
  });

  it('is undefined without a user message or without an accepted run', () => {
    expect(recordedTurn([])).toBeUndefined();
    expect(recordedTurn([user('Alone')])).toBeUndefined();
    expect(
      recordedTurn([user('Alone'), { id: 'text', role: 'assistant', content: 'Hi.' }]),
    ).toBeUndefined();
  });
});

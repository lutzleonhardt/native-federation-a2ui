import type { LanguageModelV4StreamPart } from '@ai-sdk/provider';
import { serve } from '@hono/node-server';
import { Agent } from '@mastra/core/agent';
import { MockLanguageModelV4, simulateReadableStream } from 'ai/test';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ASSISTANT_AGENT_ID } from './agent.js';
import { DEFAULT_SHELL_ORIGIN } from './config.js';
import { createApp } from './server.js';

const HELLO_CHUNKS: LanguageModelV4StreamPart[] = [
  { type: 'stream-start', warnings: [] },
  { type: 'text-start', id: '0' },
  { type: 'text-delta', id: '0', delta: 'hello' },
  { type: 'text-end', id: '0' },
  {
    type: 'finish',
    finishReason: { unified: 'stop', raw: undefined },
    usage: {
      inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    },
  },
];

const UPSTREAM_FAILURE = 'BOOM upstream failure';

function helloModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: simulateReadableStream({ chunks: HELLO_CHUNKS }) }),
  });
}

function failingModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doStream: async () => {
      throw new Error(UPSTREAM_FAILURE);
    },
  });
}

interface RunningServer {
  readonly baseUrl: string;
  readonly close: () => Promise<void>;
}

async function startServer(model: MockLanguageModelV4, shellOrigin?: string): Promise<RunningServer> {
  const agent = new Agent({
    id: ASSISTANT_AGENT_ID,
    name: ASSISTANT_AGENT_ID,
    instructions: 'test agent',
    model,
  });
  const app = createApp(new Map([[ASSISTANT_AGENT_ID, agent]]), shellOrigin);
  const server = serve({ fetch: app.fetch, port: 0 });
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function runAgentInput(): unknown {
  return {
    threadId: 'thread-1',
    runId: 'run-1',
    messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    tools: [],
    context: [],
    state: {},
  };
}

function preflight(baseUrl: string, origin: string): Promise<Response> {
  return fetch(`${baseUrl}/ag-ui/${ASSISTANT_AGENT_ID}`, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
  });
}

function postRun(baseUrl: string, agentId: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/ag-ui/${agentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * The adapter emits assistant text as `TEXT_MESSAGE_CHUNK`; AG-UI clients expand that
 * into TEXT_MESSAGE_START/CONTENT/END, so both spellings count as delivered text.
 */
const TEXT_EVENTS = ['TEXT_MESSAGE_CHUNK', 'TEXT_MESSAGE_CONTENT'];

interface SSEEvent {
  type: string;
  delta?: string;
  message?: string;
}

/** Collects the `data:` payloads of an SSE body into parsed AG-UI events. */
async function collectEvents(response: Response): Promise<SSEEvent[]> {
  const body = await response.text();
  return body
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => JSON.parse(line.slice('data:'.length).trim()));
}

describe('POST /ag-ui/:agentId', () => {
  let server: RunningServer;

  beforeAll(async () => {
    server = await startServer(helloModel());
  });

  afterAll(() => server.close());

  it('T2-AC-02 streams RUN_STARTED, the assistant text and RUN_FINISHED in order', async () => {
    const response = await postRun(server.baseUrl, ASSISTANT_AGENT_ID, runAgentInput());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const events = await collectEvents(response);
    const types = events.map((event) => event.type);

    expect(types).toContain('RUN_STARTED');
    expect(types).toContain('RUN_FINISHED');
    expect(types.indexOf('RUN_STARTED')).toBeLessThan(types.indexOf('RUN_FINISHED'));

    const text = events
      .filter((event) => TEXT_EVENTS.includes(event.type))
      .map((event) => event.delta ?? '')
      .join('');
    expect(text).toContain('hello');

    const textIndex = types.findIndex((type) => TEXT_EVENTS.includes(type));
    expect(textIndex).toBeGreaterThan(types.indexOf('RUN_STARTED'));
    expect(textIndex).toBeLessThan(types.indexOf('RUN_FINISHED'));
  });

  it('T2-AC-03 returns 404 for an unknown agent', async () => {
    const response = await postRun(server.baseUrl, 'unknown', runAgentInput());

    expect(response.status).toBe(404);
  });

  it('T2-AC-03 returns 400 for a body that is not a RunAgentInput', async () => {
    const response = await postRun(server.baseUrl, ASSISTANT_AGENT_ID, { threadId: 'only-this' });

    expect(response.status).toBe(400);
  });

  it('allows the default shell origin on the CORS preflight', async () => {
    const response = await preflight(server.baseUrl, DEFAULT_SHELL_ORIGIN);

    expect(response.headers.get('access-control-allow-origin')).toBe(DEFAULT_SHELL_ORIGIN);
  });
});

describe('POST /ag-ui/:agentId with a configured shell origin', () => {
  const OTHER_ORIGIN = 'http://localhost:4300';
  let server: RunningServer;

  beforeAll(async () => {
    server = await startServer(helloModel(), OTHER_ORIGIN);
  });

  afterAll(() => server.close());

  it('replaces the default origin instead of adding to it', async () => {
    const allowed = await preflight(server.baseUrl, OTHER_ORIGIN);
    const refused = await preflight(server.baseUrl, DEFAULT_SHELL_ORIGIN);

    expect(allowed.headers.get('access-control-allow-origin')).toBe(OTHER_ORIGIN);
    expect(refused.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('POST /ag-ui/:agentId when the model fails', () => {
  let server: RunningServer;

  beforeAll(async () => {
    server = await startServer(failingModel());
  });

  afterAll(() => server.close());

  it('terminates the stream with RUN_ERROR instead of truncating it', async () => {
    const response = await postRun(server.baseUrl, ASSISTANT_AGENT_ID, runAgentInput());
    const events = await collectEvents(response);
    const types = events.map((event) => event.type);

    expect(types).toContain('RUN_ERROR');
    expect(types.at(-1)).toBe('RUN_ERROR');
    expect(events.at(-1)?.message).toContain(UPSTREAM_FAILURE);
  });
});

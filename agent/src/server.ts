import { EventType, RunAgentInputSchema, type BaseEvent, type RunErrorEvent } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import { MastraAgent } from '@ag-ui/mastra';
import { serve } from '@hono/node-server';
import type { Agent } from '@mastra/core/agent';
import { config as loadDotenv } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Observable, Subscription } from 'rxjs';
import { fileURLToPath } from 'node:url';
import { ASSISTANT_AGENT_ID, createAssistantAgent } from './agent.js';
import { loadConfig, resolveModel } from './config.js';

export const SHELL_ORIGIN = 'http://localhost:4200';
export const AGENT_PORT = 3001;

/**
 * Loopback only. CORS restricts browsers, not access: without a bound host the
 * server listens on every interface, and any LAN peer could spend the API key.
 */
export const AGENT_HOST = '127.0.0.1';

export function createApp(agents: ReadonlyMap<string, Agent>): Hono {
  const app = new Hono();

  app.use('/ag-ui/*', cors({ origin: SHELL_ORIGIN }));

  app.post('/ag-ui/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    const agent = agents.get(agentId);
    if (!agent) {
      return c.json({ error: `Unknown agent "${agentId}".` }, 404);
    }

    const body = await c.req.json().catch(() => undefined);
    const input = RunAgentInputSchema.safeParse(body);
    if (!input.success) {
      return c.json({ error: 'Invalid RunAgentInput.', issues: input.error.issues }, 400);
    }

    const encoder = new EventEncoder();
    return new Response(toSSEStream(new MastraAgent({ agent }).run(input.data), encoder), {
      headers: {
        'Content-Type': encoder.getContentType(),
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  });

  return app;
}

/**
 * A failing run must terminate the stream with RUN_ERROR, not by erroring the
 * controller: the 200 headers are already sent, so an aborted body reaches the
 * client as a truncated-but-successful response and the run never terminates.
 */
function toSSEStream(events: Observable<BaseEvent>, encoder: EventEncoder): ReadableStream<Uint8Array> {
  const textEncoder = new TextEncoder();
  let subscription: Subscription | undefined;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: BaseEvent) =>
        controller.enqueue(textEncoder.encode(encoder.encodeSSE(event)));
      subscription = events.subscribe({
        next: send,
        error: (error: unknown) => {
          send(runError(error));
          controller.close();
        },
        complete: () => controller.close(),
      });
    },
    cancel() {
      subscription?.unsubscribe();
    },
  });
}

function runError(error: unknown): RunErrorEvent {
  return {
    type: EventType.RUN_ERROR,
    message: error instanceof Error ? error.message : String(error),
  };
}

function main(): void {
  loadDotenv({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
  const config = loadConfig(process.env);
  const agents = new Map([[ASSISTANT_AGENT_ID, createAssistantAgent(resolveModel(config, process.env))]]);
  serve({ fetch: createApp(agents).fetch, hostname: AGENT_HOST, port: AGENT_PORT }, ({ port }) => {
    console.log(`AG-UI agent on http://localhost:${port} (provider: ${config.provider})`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

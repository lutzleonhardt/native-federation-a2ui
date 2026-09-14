import { randomUUID } from 'node:crypto';
import { HttpAgent } from '@ag-ui/client';
import type { Context, Message, Tool, ToolCall } from '@ag-ui/core';
import { A2uiMessageListWrapperSchema } from '@a2ui/web_core/v0_9';
import { schemaToJsonSchema } from '@copilotkit/shared';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { catalogToContextEntry } from '../src/app/a2ui/catalog-context';
import { createdSurface } from '../src/app/a2ui/surface-host-rules';
import { meToContextEntry } from '../src/app/agent/me-context-entry';
import { findConferencesDefinition } from '../src/app/agent/tools/find-conferences.definition';
import { messageWidgetDefinition } from '../src/app/agent/tools/message-widget.definition';
import { renderSurfaceDefinition } from '../src/app/agent/tools/render-surface.definition';
import { loadConferences } from '../src/app/domain/conference';
import { findConferences, type ConferenceResult } from '../src/app/domain/find-conferences';
import type { Me } from '../src/app/domain/location.store';
import { score, type RecordedCall, type Requirement } from './score';

/**
 * Drives the real agent the way the shell does, but headless: same tool
 * definitions, same context serializer, client tools executed in Node. It
 * measures how *reliably* the model wires a surface — the one thing the
 * browser specs cannot answer, because they script the agent's answers.
 *
 * Costs real model calls. Not a test, not in CI: `npm run eval`.
 */

const AGENT_URL = process.env['EVAL_AGENT_URL'] ?? 'http://localhost:3001/ag-ui/assistant';
const RUNS_PER_REQUEST = positiveInteger(process.env['EVAL_RUNS'], 5, 'EVAL_RUNS');
/** The gate is "4 out of 5" — as a ratio, so a shorter smoke run is judged by the same bar. */
const PASS_RATIO = 4 / 5;

/** Fixed so a run is comparable across models; the shell would take this from the picker. */
const ME: Me = { city: 'Berlin', lat: 52.52, lon: 13.405 };

/** Requests 2 and 3 continue the conversation started by request 1. */
const REQUESTS: readonly { readonly requirement: Requirement; readonly prompt: string }[] = [
  { requirement: 'A1', prompt: 'Welche Angular-Konferenzen gibt es in den nächsten Monaten?' },
  { requirement: 'A2', prompt: 'Zeig sie auf einer Karte' },
  {
    requirement: 'A3',
    prompt: 'Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details.',
  },
];

/** Initial run plus the follow-up after findConferences plus one correction. */
const MAX_RUNS_PER_REQUEST = 4;

/** The framework-free half of a client tool, exactly as the shell registers it. */
interface ToolSpec {
  readonly definition: {
    readonly name: string;
    readonly description: string;
    readonly parameters: z.ZodType;
  };
  /** Mirrors the shell's `FrontendToolSpec.followUp`: does the turn continue after this call? */
  readonly followUp: boolean;
}

const TOOL_SPECS: readonly ToolSpec[] = [
  { definition: findConferencesDefinition, followUp: true },
  { definition: renderSurfaceDefinition, followUp: false },
  { definition: messageWidgetDefinition, followUp: false },
];

/**
 * What the model reads back. The shape must match the shell's tool results
 * exactly (`find-conferences.tool.ts`, `render-surface.tool.ts`) — the model
 * reasons about these fields, so a nested or renamed field measures a context
 * the browser never produces.
 */
interface ToolOutcome {
  readonly result: Record<string, unknown>;
  readonly followUp: boolean;
}

/** What one request produced in one run. */
interface RunRecord {
  readonly calls: RecordedCall[];
  readonly durationMs: number;
}

/** A run count of 0 — or a typo — would otherwise score 0/0 as a passed gate. */
function positiveInteger(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    console.error(`${name} must be a positive integer, got "${raw}".`);
    process.exit(1);
  }
  return value;
}

function main(): Promise<void> {
  return runEval().then((failed) => {
    process.exitCode = failed ? 1 : 0;
  });
}

async function runEval(): Promise<boolean> {
  await assertAgentReachable();

  const tools = TOOL_SPECS.map(toAgUiTool);
  const context: Context[] = [catalogToContextEntry(), meToContextEntry(ME)];
  const records: RunRecord[][] = REQUESTS.map(() => []);

  for (let run = 0; run < RUNS_PER_REQUEST; run += 1) {
    const agent = new HttpAgent({ url: AGENT_URL, agentId: 'assistant' });
    const session = newSession();
    for (const [index, request] of REQUESTS.entries()) {
      process.stdout.write(`run ${run + 1}/${RUNS_PER_REQUEST} · ${request.requirement} … `);
      const record = await driveRequest(agent, tools, context, request.prompt, session);
      records[index].push(record);
      const verdict = score(request.requirement, record.calls);
      console.log(verdict.passed ? `ok (${record.durationMs} ms)` : `fail: ${verdict.reasons.join('; ')}`);
    }
  }

  return report(records);
}

function report(records: readonly RunRecord[][]): boolean {
  console.log('\n— Summary —');
  let failed = false;
  for (const [index, request] of REQUESTS.entries()) {
    const verdicts = records[index].map((record) => score(request.requirement, record.calls));
    const passes = verdicts.filter((verdict) => verdict.passed).length;
    // An empty result proves nothing; only a non-empty run can clear the gate.
    const gate = verdicts.length > 0 && passes >= Math.ceil(verdicts.length * PASS_RATIO);
    failed ||= !gate;
    console.log(
      `Request ${index + 1} (${request.requirement}): ${passes}/${records[index].length}${gate ? '' : '  ← below gate'}`,
    );
    for (const [run, verdict] of verdicts.entries()) {
      if (!verdict.passed) console.log(`    run ${run + 1}: ${verdict.reasons.join('; ')}`);
    }
  }
  console.log(failed ? '\nGate NOT reached.' : '\nGate reached.');
  return failed;
}

/**
 * One request: run, execute whatever client tools the model called, run again
 * while the turn continues. The same loop CopilotKit runs in the browser.
 */
async function driveRequest(
  agent: HttpAgent,
  tools: readonly Tool[],
  context: readonly Context[],
  prompt: string,
  session: Session,
): Promise<RunRecord> {
  const started = Date.now();
  const calls: RecordedCall[] = [];
  agent.messages.push({ id: randomUUID(), role: 'user', content: prompt } as Message);

  for (let attempt = 0; attempt < MAX_RUNS_PER_REQUEST; attempt += 1) {
    await agent.runAgent({ tools: [...tools], context: [...context] });

    const pending = pendingToolCalls(agent.messages);
    if (pending.length === 0) break;

    let continueTurn = false;
    for (const call of pending) {
      const outcome = execute(call, calls, session);
      agent.messages.push({
        id: randomUUID(),
        role: 'tool',
        content: JSON.stringify(outcome.result),
        toolCallId: call.id,
      } as Message);
      continueTurn ||= outcome.followUp;
    }
    if (!continueTurn) break;
  }

  return { calls, durationMs: Date.now() - started };
}

interface Session {
  result?: ReturnType<typeof findConferences>;
}

function newSession(): Session {
  return {};
}

/**
 * Validates like the shell's tool boundary, then records instead of rendering.
 * Host rules beyond shape (writing client-owned paths) are deliberately *not*
 * rejected here — the scorer has to see them, that is what is being measured.
 */
function execute(call: ToolCall, calls: RecordedCall[], session: Session): ToolOutcome {
  const spec = TOOL_SPECS.find((candidate) => candidate.definition.name === call.function.name);
  if (spec === undefined) {
    return { result: { ok: false, code: 'unknown_tool', result: call.function.name }, followUp: true };
  }

  let args: unknown;
  try {
    args = JSON.parse(call.function.arguments || '{}');
  } catch (error) {
    return { result: { ok: false, code: 'invalid_args', result: String(error) }, followUp: true };
  }

  const parsed = spec.definition.parameters.safeParse(args);
  if (!parsed.success) {
    return { result: { ok: false, code: 'invalid_args', result: parsed.error.issues }, followUp: true };
  }

  switch (spec.definition.name) {
    case findConferencesDefinition.name:
      return { result: runFindConferences(parsed.data, session), followUp: true };
    case renderSurfaceDefinition.name:
      return recordSurface(parsed.data, calls);
    default:
      return { result: { ok: true }, followUp: false };
  }
}

function runFindConferences(args: unknown, session: Session): ToolOutcome['result'] {
  const today = new Date();
  const result = findConferences(args as Parameters<typeof findConferences>[0], {
    confs: loadConferences(today),
    me: ME,
    today,
  });
  session.result = result;

  const next = result.confs[0];
  // Flat, like FindConferencesToolResult in the shell — not wrapped in `result`.
  return {
    ok: true,
    count: result.confs.length,
    mountedAt: '/filteredConfs',
    ...(next === undefined ? {} : { next: compact(next) }),
  };
}

function compact({ id, name, city, date, distanceKm }: ConferenceResult): Record<string, unknown> {
  return { id, name, city, date, ...(distanceKm === undefined ? {} : { distanceKm }) };
}

/** The authoritative A2UI check the shell also runs before touching the renderer. */
function recordSurface(args: unknown, calls: RecordedCall[]): ToolOutcome {
  const parsed = A2uiMessageListWrapperSchema.safeParse(args);
  if (!parsed.success) {
    return { result: { ok: false, code: 'invalid_messages', result: parsed.error.issues }, followUp: true };
  }
  calls.push(args as RecordedCall);
  // Mirrors RenderSurfaceToolResult: { ok, surfaceId }.
  const surface = createdSurface((args as RecordedCall).messages ?? []);
  return { result: { ok: true, surfaceId: surface?.surfaceId }, followUp: false };
}

function pendingToolCalls(messages: readonly Message[]): ToolCall[] {
  const answered = new Set(
    messages.flatMap((message) => (message.role === 'tool' ? [message.toolCallId] : [])),
  );
  return messages
    .flatMap((message) => (message.role === 'assistant' ? (message.toolCalls ?? []) : []))
    .filter((call) => !answered.has(call.id));
}

/**
 * Mirrors CopilotKit's `createToolSchema` and `bindFrontendTool` so the model
 * sees the same tool list as in the browser (XC-04). Both live in CopilotKit
 * internals that are not exported; the shared converter at least is.
 */
function toAgUiTool(spec: ToolSpec): Tool {
  const schema = schemaToJsonSchema(spec.definition.parameters, {
    zodToJsonSchema: (value: unknown, options: unknown) =>
      zodToJsonSchema(value as Parameters<typeof zodToJsonSchema>[0], options as never),
  }) as Record<string, unknown>;
  delete schema['$schema'];
  stripAdditionalProperties(schema);
  return {
    name: spec.definition.name,
    description: spec.followUp
      ? spec.definition.description
      : `${spec.definition.description} Calling this tool ends your turn.`,
    parameters: schema,
  } as Tool;
}

function stripAdditionalProperties(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(stripAdditionalProperties);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  delete (node as Record<string, unknown>)['additionalProperties'];
  Object.values(node).forEach(stripAdditionalProperties);
}

async function assertAgentReachable(): Promise<void> {
  try {
    await fetch(AGENT_URL, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Agent not reachable at ${AGENT_URL} — start it with \`npm run start:agent\`.`);
    console.error(String(error));
    process.exit(1);
  }
}

await main();

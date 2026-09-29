import type { Recordings } from '../replay/recordings';

/** Who answers the chat: the local agent server, or recordings played back in the browser. */
export type AgentMode = 'local' | 'replay';

/**
 * The mode with what it needs; only replay carries data, fetched before Angular boots.
 * `record` asks the local agent's answers to be written down (dev-only, `?record`); the
 * replay variant has no such field, so replay never records. `city` is the picker id the
 * recordings were captured in and replay pins the location to it; absent when the file
 * was refused, and then nothing plays.
 */
export type AgentSetup =
  | { readonly mode: 'local'; readonly record?: boolean }
  | { readonly mode: 'replay'; readonly recordings: Recordings; readonly city?: string };

const QUERY_PARAM = 'agent';
const RECORD_PARAM = 'record';

/** `?agent=local|replay` wins; a missing or unknown value keeps the build's default. */
export function resolveAgentMode(search: string, buildDefault: AgentMode): AgentMode {
  const requested = new URLSearchParams(search).get(QUERY_PARAM);
  return requested === 'local' || requested === 'replay' ? requested : buildDefault;
}

/** `?record` is a switch: present or not, its value is ignored. */
export function recordRequested(search: string): boolean {
  return new URLSearchParams(search).has(RECORD_PARAM);
}

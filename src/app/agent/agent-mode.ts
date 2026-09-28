import type { Recordings } from '../replay/recordings';

/** Who answers the chat: the local agent server, or recordings played back in the browser. */
export type AgentMode = 'local' | 'replay';

/** The mode with what it needs; only replay carries data, fetched before Angular boots. */
export type AgentSetup =
  { readonly mode: 'local' } | { readonly mode: 'replay'; readonly recordings: Recordings };

const QUERY_PARAM = 'agent';

/** `?agent=local|replay` wins; a missing or unknown value keeps the build's default. */
export function resolveAgentMode(search: string, buildDefault: AgentMode): AgentMode {
  const requested = new URLSearchParams(search).get(QUERY_PARAM);
  return requested === 'local' || requested === 'replay' ? requested : buildDefault;
}

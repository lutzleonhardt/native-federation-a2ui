/**
 * What the shell, the agent server and the eval harness must agree on. Kept
 * import-free: it is the one file all three module resolutions (Angular
 * bundler, `nodenext`, eval) load, and the sibling `package.json` marks it ESM
 * so the agent's `nodenext` build does not read it as CommonJS.
 */

export const ASSISTANT_AGENT_ID = 'assistant';

export const AGENT_PORT = 3001;

/** The context entries are addressed by their `description` — the only handle AG-UI's `Context` gives. */
export const CATALOG_CONTEXT_DESCRIPTION = 'A2UI Custom Catalog';
export const LOCATION_CONTEXT_DESCRIPTION = 'User location (me)';

/**
 * The one route shape the server serves and both clients call; the server
 * passes a Hono pattern (`:agentId`, `*`). The literal return type is what lets
 * Hono keep typing the route's path parameter.
 */
export function agUiPath<Segment extends string>(agentId: Segment): `/ag-ui/${Segment}` {
  return `/ag-ui/${agentId}`;
}

/** Where the locally started agent server answers. */
export function localAgentUrl(agentId: string): string {
  return `http://localhost:${AGENT_PORT}${agUiPath(agentId)}`;
}

import type { Context } from '@ag-ui/core';
import { LOCATION_CONTEXT_DESCRIPTION } from '../../../shared/agent-contract';
import type { Me } from '../domain/location.store';

/** Counterpart of `catalogToContextEntry`: the description is prompt text, so it lives with the context assembly, not in the domain. */
export function meToContextEntry(me: Me | undefined): Context {
  return {
    description: LOCATION_CONTEXT_DESCRIPTION,
    value: me === undefined ? 'unknown — the user has not chosen a city yet' : JSON.stringify(me),
  };
}

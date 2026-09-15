import { BASIC_COMPONENTS, BASIC_FUNCTIONS, BasicCatalogBase } from '@a2ui/angular/v0_9';
import type { CatalogFragment } from '../../../shared/capabilities/agent-capability';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog-id';

export { ASSISTANT_CATALOG_ID };

/**
 * Merges fragments into one deduplicated vocabulary. Names already taken by the
 * basic catalog or an earlier fragment are dropped — first registration wins.
 */
export function mergeFragments(
  fragments: readonly CatalogFragment[],
  options: { warn: boolean } = { warn: true },
): CatalogFragment {
  return {
    components: uniqueByName(
      'component',
      BASIC_COMPONENTS.map((component) => component.name),
      fragments.flatMap((fragment) => fragment.components),
      options.warn,
    ),
    functions: uniqueByName(
      'function',
      BASIC_FUNCTIONS.map((fn) => fn.name),
      fragments.flatMap((fragment) => fragment.functions),
      options.warn,
    ),
  };
}

export function createAssistantCatalog(fragments: readonly CatalogFragment[]): BasicCatalogBase {
  const merged = mergeFragments(fragments);
  return new BasicCatalogBase({
    id: ASSISTANT_CATALOG_ID,
    extraComponents: [...merged.components],
    // BasicCatalogBase treats `functions` as a replacement for the basic list,
    // not an extension — spread the basics back in or lose all 25 of them.
    functions: [...BASIC_FUNCTIONS, ...merged.functions],
  });
}

function uniqueByName<T extends { readonly name: string }>(
  kind: string,
  reservedNames: readonly string[],
  items: readonly T[],
  warn: boolean,
): readonly T[] {
  const seen = new Set(reservedNames);
  const kept: T[] = [];
  for (const item of items) {
    if (seen.has(item.name)) {
      if (warn) {
        console.warn(
          `Assistant catalog: duplicate ${kind} name "${item.name}" — keeping the first registration.`,
        );
      }
      continue;
    }
    seen.add(item.name);
    kept.push(item);
  }
  return kept;
}

import { A2uiMessageListWrapperSchema } from '@a2ui/web_core/v0_9';
import { describe, expect, it } from 'vitest';
import { buildInstructions } from '../agent/src/prompt';
import { findStructuralViolations } from '../src/app/a2ui/surface-host-rules';

/** The example surfaces as the model reads them; the catalogId placeholder is not JSON. */
function exampleMessageLists(): unknown[][] {
  const prompt = buildInstructions([]);
  return [...prompt.matchAll(/```json\n([\s\S]*?)\n```/g)].map(([, block]) =>
    JSON.parse(block.replace(/"<the catalogId from the Custom Catalog section>"/g, '"catalog"')),
  );
}

// The examples are what the model imitates: a malformed one teaches a shape the
// shell's renderSurface boundary rejects, and no other suite parses them.
describe('prompt examples', () => {
  it('pass the A2UI message schema and the host rules the shell validates with', () => {
    const lists = exampleMessageLists();
    expect(lists).toHaveLength(2);
    for (const messages of lists) {
      const parsed = A2uiMessageListWrapperSchema.safeParse({ messages });
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      expect(findStructuralViolations(messages)).toEqual([]);
    }
  });
});

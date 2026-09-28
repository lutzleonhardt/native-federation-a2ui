import { describe, expect, it } from 'vitest';
import { resolveAgentMode } from './agent-mode';

describe('resolveAgentMode', () => {
  it('T3-AC-04 ?agent= overrides the build default in both directions', () => {
    expect(resolveAgentMode('?agent=replay', 'local')).toBe('replay');
    expect(resolveAgentMode('?capabilities=charts&agent=local', 'replay')).toBe('local');
  });

  it('T3-AC-04 without the parameter, or with an unknown value, the build default decides', () => {
    expect(resolveAgentMode('', 'local')).toBe('local');
    expect(resolveAgentMode('?capabilities=maps', 'replay')).toBe('replay');
    expect(resolveAgentMode('?agent=cloud', 'local')).toBe('local');
    expect(resolveAgentMode('?agent=', 'replay')).toBe('replay');
  });
});

import type { FederationManifest } from '@angular-architects/native-federation-v4';
import { describe, expect, it } from 'vitest';
import { selectCapabilities } from './select-capabilities';

const MANIFEST: FederationManifest = {
  charts: 'http://localhost:4201/remoteEntry.json',
  maps: 'http://localhost:4202/remoteEntry.json',
};

describe('selectCapabilities (T3-AC-03)', () => {
  it('keeps every manifest entry without the parameter', () => {
    expect(selectCapabilities(MANIFEST, '')).toEqual(MANIFEST);
    expect(selectCapabilities(MANIFEST, '?other=1')).toEqual(MANIFEST);
  });

  it('keeps nothing for an empty parameter', () => {
    expect(selectCapabilities(MANIFEST, '?capabilities=')).toEqual({});
  });

  it('ignores names the manifest does not carry', () => {
    expect(selectCapabilities(MANIFEST, '?capabilities=maps,ghost')).toEqual({
      maps: MANIFEST['maps'],
    });
  });

  it('keeps manifest order, not query order', () => {
    const selected = selectCapabilities(MANIFEST, '?capabilities=maps, charts');

    expect(Object.keys(selected)).toEqual(['charts', 'maps']);
  });
});

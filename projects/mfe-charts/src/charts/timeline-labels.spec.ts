import { describe, expect, it } from 'vitest';
import { type LabelBlock, labelsFit } from './timeline-labels';

// The rail's sizes: a ten-character date is 66 units wide, a label 7.2 units per character.
const METRICS = { labelSize: 12, dateSize: 11, minGap: 6 };

const block = (x: number, label: string): LabelBlock => ({ x, label, date: '2026-10-01' });

describe('labelsFit', () => {
  it('is true for an empty row and for a single block', () => {
    expect(labelsFit([], METRICS)).toBe(true);
    expect(labelsFit([block(64, 'ng-harbor Copenhagen')], METRICS)).toBe(true);
  });

  it('needs the gap between the estimated block edges to reach the minimum', () => {
    // Short labels: the date is the wider part, so both blocks are 66 wide.
    expect(labelsFit([block(100, 'Talk 1'), block(172, 'Talk 2')], METRICS)).toBe(true);
    expect(labelsFit([block(100, 'Talk 1'), block(171, 'Talk 2')], METRICS)).toBe(false);
  });

  it('takes the label width when the label is wider than the date', () => {
    // 20 characters → 144 wide, half 72; the short block's half is 33; plus the gap: 111.
    expect(labelsFit([block(100, 'ng-harbor Copenhagen'), block(211, 'Talk 2')], METRICS)).toBe(
      true,
    );
    expect(labelsFit([block(100, 'ng-harbor Copenhagen'), block(210, 'Talk 2')], METRICS)).toBe(
      false,
    );
  });

  it('sorts by position, so the order of the row does not matter', () => {
    const row = [block(300, 'Talk 3'), block(100, 'Talk 1'), block(160, 'Talk 2')];
    expect(labelsFit(row, METRICS)).toBe(false);
    expect(labelsFit([row[0], row[1]], METRICS)).toBe(true);
  });
});

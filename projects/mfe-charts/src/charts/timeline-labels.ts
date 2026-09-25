/** A label block on the rail: the label with its date underneath, centred on `x` (viewBox units). */
export interface LabelBlock {
  readonly x: number;
  readonly label: string;
  readonly date: string;
}

/** The rail's text sizes in viewBox units and the gap two blocks must keep. */
export interface LabelMetrics {
  readonly labelSize: number;
  readonly dateSize: number;
  readonly minGap: number;
}

/**
 * Estimated, not measured: a conservative 0.6 em per character for the UI face (covers the bold
 * selected label), the exact 0.6 em advance of the mono date.
 */
const EM_PER_CHAR = 0.6;

/**
 * Whether the blocks of one row — one side of the rail — can be drawn without touching. Works in
 * viewBox units only, so the answer depends on the items and the range, never on the rendered width.
 */
export function labelsFit(row: readonly LabelBlock[], metrics: LabelMetrics): boolean {
  const blocks = [...row].sort((a, b) => a.x - b.x);
  return blocks.every((block, index) => {
    if (index === 0) return true;
    const previous = blocks[index - 1];
    const gap = block.x - halfWidth(block, metrics) - (previous.x + halfWidth(previous, metrics));
    return gap >= metrics.minGap;
  });
}

function halfWidth(block: LabelBlock, metrics: LabelMetrics): number {
  const label = block.label.length * metrics.labelSize;
  const date = block.date.length * metrics.dateSize;
  return (EM_PER_CHAR * Math.max(label, date)) / 2;
}

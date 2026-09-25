import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  input,
} from '@angular/core';
import type { BoundProperty } from '@a2ui/angular/v0_9';
import type { Action } from '@a2ui/web_core/v0_9';
import { dispatchSurfaceAction } from '../../../../shared/capabilities/surface-action';
import { type MonthMark, dateScale, monthMarks, relativeDays } from './timeline-dates';
import { labelsFit } from './timeline-labels';

/**
 * `label` is optional at runtime: path-bound items bypass schema validation,
 * and the conference objects on `/filteredConfs` carry `name` instead.
 */
export interface TimelineItem {
  readonly id: string;
  readonly label?: string;
  readonly date: string;
  readonly [extra: string]: unknown;
}

/** Bound props as the renderer delivers them; mirrors `timelineSchema`. */
export interface TimelineProps {
  readonly items: BoundProperty<readonly TimelineItem[]>;
  readonly range?: BoundProperty<{ readonly from: string; readonly to: string } | undefined>;
  readonly selected?: BoundProperty<unknown>;
  readonly action?: BoundProperty<Action | undefined>;
}

interface TimelineMarker {
  readonly item: TimelineItem;
  readonly label: string;
  readonly date: string;
  readonly selected: boolean;
  readonly x: number;
  readonly side: 'above' | 'below';
  readonly labelY: number;
  readonly dateY: number;
  readonly captionY: number;
  /** Far end of the stem; the near end is the dot on the axis. */
  readonly stemY: number;
}

/**
 * Rail geometry in viewBox units — the frame's desktop pixels. The viewBox is fixed and the
 * svg scales uniformly, so the rendered width changes how large labels are, never whether
 * two of them overlap; the label-fit rule rests on that.
 */
const RAIL = {
  width: 832,
  height: 220,
  // Room for the middle-anchored labels of the edge markers.
  xMin: 64,
  xMax: 768,
  axisY: 99,
  monthAxisY: 184,
  tickHalf: 4.5,
  // A three-letter month or a four-digit year in mono at 10 units is at most about 24 wide.
  monthLabelGap: 28,
  monthLabelY: 204,
  yearY: 216,
} as const;

// Labels alternate above and below the axis; each side reads label, date, caption away from the dot.
const ABOVE = { side: 'above', labelY: 12, dateY: 29, captionY: 46, stemY: 54 } as const;
const BELOW = { side: 'below', labelY: 132, dateY: 149, captionY: 166, stemY: 120 } as const;

/** The rail's text sizes as `timeline.component.css` sets them; the gap is half a label character. */
const LABELS = { labelSize: 12, dateSize: 11, minGap: 6 } as const;

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
  host: { '[attr.data-layout]': 'layout()' },
})
export class TimelineComponent {
  /**
   * The a2ui component host binds all four inputs unconditionally — declare
   * them or its setInput reports unknown-input errors.
   */
  readonly props = input.required<TimelineProps>();
  readonly surfaceId = input.required<string>();
  readonly componentId = input.required<string>();
  readonly dataContextPath = input<string>('/');

  protected readonly rail = RAIL;
  protected readonly viewBox = `0 0 ${RAIL.width} ${RAIL.height}`;

  private readonly injector = inject(Injector);

  private readonly selectedId = computed(
    () => (this.props().selected?.value() as { id?: unknown } | undefined)?.id,
  );

  private readonly items = computed<readonly TimelineItem[]>(() =>
    [...(this.props().items.value() ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
  );

  private readonly scale = computed(() => {
    const items = this.items();
    if (items.length === 0) return undefined;
    const dates = items.map((item) => item.date);
    return dateScale(dates, this.props().range?.value(), RAIL.xMin, RAIL.xMax);
  });

  protected readonly markers = computed<readonly TimelineMarker[]>(() => {
    const scale = this.scale();
    if (scale === undefined) return [];
    const selectedId = this.selectedId();
    return this.items().map((item, index) => ({
      item,
      label: labelOf(item),
      date: item.date,
      selected: item.id === selectedId,
      x: scale.x(Date.parse(item.date)),
      ...(index % 2 === 0 ? ABOVE : BELOW),
    }));
  });

  /**
   * `'board'` when a side of the rail cannot hold its label blocks, `null` to let the width rule
   * in the CSS choose. Decided on the positions the rail draws, so a squeezing `range` counts and
   * the rendered width never does.
   */
  protected readonly layout = computed<'board' | null>(() => {
    const markers = this.markers();
    const rows = [ABOVE.side, BELOW.side].map((side) =>
      markers.filter((marker) => marker.side === side),
    );
    return rows.every((row) => labelsFit(row, LABELS)) ? null : 'board';
  });

  protected readonly months = computed<readonly MonthMark[]>(() => {
    const scale = this.scale();
    if (scale === undefined) return [];
    return monthMarks(scale, RAIL.monthLabelGap);
  });

  /** Relative-time caption of the selected item; English whatever the browser language. */
  protected readonly caption = computed(() => {
    const selected = this.markers().find((marker) => marker.selected);
    return selected === undefined ? '' : relativeDays(selected.item.date);
  });

  protected pick(item: TimelineItem): void {
    this.props().selected?.onUpdate(item);
    const action = this.props().action?.value();
    if (action !== undefined) {
      dispatchSurfaceAction(
        this.injector,
        this.surfaceId(),
        this.dataContextPath(),
        this.componentId(),
        action,
      );
    }
  }
}

function labelOf(item: TimelineItem): string {
  return String(item.label ?? item['name'] ?? item.id);
}

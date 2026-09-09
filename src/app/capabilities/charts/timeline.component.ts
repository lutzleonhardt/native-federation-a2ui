import { ChangeDetectionStrategy, Component, Injector, computed, inject, input } from '@angular/core';
import type { BoundProperty } from '@a2ui/angular/v0_9';
import type { Action } from '@a2ui/web_core/v0_9';
import { dispatchSurfaceAction } from '../shared/surface-action';

/**
 * `label` is optional at runtime: path-bound items bypass schema validation,
 * and the conference objects on `/confs` carry `name` instead.
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
  readonly x: number;
  readonly labelY: number;
  readonly dateY: number;
}

const AXIS_Y = 55;
// Wide enough that middle-anchored labels of edge markers stay in the viewBox.
const X_MIN = 40;
const X_MAX = 360;

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.component.html',
  styles: `
    /* Explicit width: a viewBox-only svg has no intrinsic size and would
       collapse to 0x0 inside the renderer's flex rows. */
    :host {
      display: block;
      width: 100%;
      min-width: 20rem;
    }
    svg {
      display: block;
      width: 100%;
    }
    .cf-axis {
      stroke: #999;
    }
    .cf-stem {
      stroke: #ccc;
    }
    .cf-marker {
      cursor: pointer;
    }
    .cf-dot {
      fill: #3f51b5;
    }
    .cf-selected .cf-dot {
      fill: #ff9800;
      r: 7px;
    }
    .cf-label {
      font-size: 8px;
    }
    .cf-selected .cf-label {
      font-weight: 700;
    }
    .cf-date {
      font-size: 6px;
      fill: #666;
    }
  `,
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

  protected readonly axisY = AXIS_Y;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;

  private readonly injector = inject(Injector);

  protected readonly selectedId = computed(
    () => (this.props().selected?.value() as { id?: unknown } | undefined)?.id,
  );

  protected readonly markers = computed<readonly TimelineMarker[]>(() => {
    const items = [...(this.props().items.value() ?? [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    if (items.length === 0) return [];

    const range = this.props().range?.value();
    const times = items.map((item) => Date.parse(item.date));
    const from = range === undefined ? Math.min(...times) : Date.parse(range.from);
    const span = Math.max((range === undefined ? Math.max(...times) : Date.parse(range.to)) - from, 1);

    return items.map((item, index) => ({
      item,
      x: X_MIN + ((Date.parse(item.date) - from) / span) * (X_MAX - X_MIN),
      // Alternating label rows keep close-by markers readable.
      labelY: index % 2 === 0 ? 14 : 30,
      dateY: index % 2 === 0 ? 70 : 82,
    }));
  });

  protected labelOf(item: TimelineItem): string {
    return String(item.label ?? item['name'] ?? item.id);
  }

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

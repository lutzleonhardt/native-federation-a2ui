import { ChangeDetectionStrategy, Component, Injector, computed, inject, input } from '@angular/core';
import type { BoundProperty } from '@a2ui/angular/v0_9';
import type { Action } from '@a2ui/web_core/v0_9';
import { dispatchSurfaceAction } from '../shared/surface-action';

/**
 * `label` is optional at runtime: path-bound points bypass schema validation,
 * and the conference objects on `/filteredConfs` carry `name` instead.
 */
export interface MapPoint {
  readonly id: string;
  readonly label?: string;
  readonly lat: number;
  readonly lon: number;
  readonly [extra: string]: unknown;
}

export interface MapCenter {
  readonly lat: number;
  readonly lon: number;
  readonly city?: string;
}

/** Bound props as the renderer delivers them; mirrors `mapSchema`. */
export interface MapProps {
  readonly points: BoundProperty<readonly MapPoint[]>;
  readonly center?: BoundProperty<MapCenter | undefined>;
  readonly selected?: BoundProperty<unknown>;
  readonly action?: BoundProperty<Action | undefined>;
}

interface MapMarker {
  readonly point: MapPoint;
  readonly x: number;
  readonly y: number;
}

interface GridLine {
  readonly deg: number;
  readonly pos: number;
}

interface MapView {
  readonly markers: readonly MapMarker[];
  readonly center?: { readonly x: number; readonly y: number; readonly city?: string };
  readonly latLines: readonly GridLine[];
  readonly lonLines: readonly GridLine[];
}

const VIEW_W = 400;
const VIEW_H = 260;
const PAD = 24;
/** Grid steps in degrees; the first that yields at most this many lines wins. */
const GRID_STEPS = [0.5, 1, 2, 5, 10, 20];
const MAX_GRID_LINES = 8;

const EMPTY_VIEW: MapView = { markers: [], latLines: [], lonLines: [] };

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map.component.html',
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
      background: #f4f7fa;
    }
    .cf-grid {
      stroke: #dde4ea;
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
    .cf-center-mark {
      stroke: #d32f2f;
      stroke-width: 2;
      fill: none;
    }
  `,
})
export class MapComponent {
  /**
   * The a2ui component host binds all four inputs unconditionally — declare
   * them or its setInput reports unknown-input errors.
   */
  readonly props = input.required<MapProps>();
  readonly surfaceId = input.required<string>();
  readonly componentId = input.required<string>();
  readonly dataContextPath = input<string>('/');

  protected readonly viewW = VIEW_W;
  protected readonly viewH = VIEW_H;

  private readonly injector = inject(Injector);

  protected readonly selectedId = computed(
    () => (this.props().selected?.value() as { id?: unknown } | undefined)?.id,
  );

  protected readonly view = computed<MapView>(() => {
    const points = this.props().points.value() ?? [];
    const center = this.props().center?.value();
    const coords: readonly { lat: number; lon: number }[] =
      center === undefined ? points : [...points, center];
    if (coords.length === 0) return EMPTY_VIEW;

    const project = createProjection(coords);
    return {
      markers: declutter(points.map((point) => ({ point, ...project(point) }))),
      center: center === undefined ? undefined : { ...project(center), city: center.city },
      latLines: gridLines(coords.map((c) => c.lat)).map((deg) => ({
        deg,
        pos: project({ lat: deg, lon: coords[0].lon }).y,
      })),
      lonLines: gridLines(coords.map((c) => c.lon)).map((deg) => ({
        deg,
        pos: project({ lat: coords[0].lat, lon: deg }).x,
      })),
    };
  });

  protected labelOf(point: MapPoint): string {
    return String(point.label ?? point['name'] ?? point.id);
  }

  protected crossPath(x: number, y: number): string {
    return `M ${x - 6} ${y} L ${x + 6} ${y} M ${x} ${y - 6} L ${x} ${y + 6}`;
  }

  protected pick(point: MapPoint): void {
    this.props().selected?.onUpdate(point);
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

/**
 * Equirectangular projection over the bounding box of the given coordinates:
 * x is longitude scaled by cos(mid latitude), y is latitude flipped. One
 * uniform scale keeps the aspect ratio; the content is centered with padding.
 */
function createProjection(
  coords: readonly { lat: number; lon: number }[],
): (coord: { lat: number; lon: number }) => { x: number; y: number } {
  const lats = coords.map((c) => c.lat);
  const lons = coords.map((c) => c.lon);
  const latMax = Math.max(...lats);
  const latMin = Math.min(...lats);
  const lonMin = Math.min(...lons);
  const cosMid = Math.cos((((latMax + latMin) / 2) * Math.PI) / 180);

  // A minimum span keeps a single point (or one city) from dividing by zero.
  const spanX = Math.max((Math.max(...lons) - lonMin) * cosMid, 0.5);
  const spanY = Math.max(latMax - latMin, 0.5);
  const scale = Math.min((VIEW_W - 2 * PAD) / spanX, (VIEW_H - 2 * PAD) / spanY);
  const offsetX = (VIEW_W - spanX * scale) / 2;
  const offsetY = (VIEW_H - spanY * scale) / 2;

  return ({ lat, lon }) => ({
    x: offsetX + (lon - lonMin) * cosMid * scale,
    y: offsetY + (latMax - lat) * scale,
  });
}

/** Cell size for detecting colliding markers; roughly two marker diameters. */
const DECLUTTER_CELL = 12;
const DECLUTTER_RADIUS = 9;

/**
 * Markers whose projected positions coincide (same city → identical
 * coordinates) get a small deterministic radial spread — otherwise only the
 * top-most marker of a stack would ever receive the click.
 */
function declutter(markers: readonly MapMarker[]): MapMarker[] {
  const groups = new Map<string, MapMarker[]>();
  for (const marker of markers) {
    const key = `${Math.round(marker.x / DECLUTTER_CELL)}:${Math.round(marker.y / DECLUTTER_CELL)}`;
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [marker]);
    } else {
      group.push(marker);
    }
  }
  return [...groups.values()].flatMap((group) =>
    group.length === 1
      ? group
      : group.map((marker, index) => ({
          ...marker,
          x: marker.x + DECLUTTER_RADIUS * Math.cos((2 * Math.PI * index) / group.length),
          y: marker.y + DECLUTTER_RADIUS * Math.sin((2 * Math.PI * index) / group.length),
        })),
  );
}

function gridLines(values: readonly number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step =
    GRID_STEPS.find((candidate) => (max - min) / candidate <= MAX_GRID_LINES) ??
    GRID_STEPS[GRID_STEPS.length - 1];

  const lines: number[] = [];
  for (let deg = Math.ceil(min / step) * step; deg <= max; deg += step) {
    lines.push(Number(deg.toFixed(4)));
  }
  return lines;
}

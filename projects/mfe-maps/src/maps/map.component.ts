import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { BoundProperty } from '@a2ui/angular/v0_9';
import type { Action } from '@a2ui/web_core/v0_9';
import {
  type GeoJSONSource,
  LngLatBounds,
  MapLibreMap,
  type Marker,
  setWorkerUrl,
} from 'maplibre-gl';
import { dispatchSurfaceAction } from '../../../../shared/capabilities/surface-action';
import {
  createCenterMarker,
  createPointMarker,
  labelCollection,
  pixelOffsets,
} from './map-markers';
import { MAP_RESOURCES } from './map-resources';
import { DOT_BOX_IMAGE, LABELS_SOURCE, bareStyle, dotBoxImage, labelLayers } from './map-style';

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

/** Room for the labels around the outermost dots; one city never zooms down to streets. */
const FIT_OPTIONS = { padding: 40, maxZoom: 9, duration: 0 } as const;

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  // MapLibre builds its own DOM (canvas, controls, markers), which emulated encapsulation cannot
  // style; every rule of the stylesheet is scoped under `.cf-map` instead.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cf-map' },
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

  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly resources = inject(MAP_RESOURCES);

  /** Set once the style is in place and the label layers exist; the effects wait for it. */
  private readonly map = signal<MapLibreMap | undefined>(undefined);
  /** The instance from the moment it exists, so an early teardown still removes it. */
  private instance?: MapLibreMap;
  private destroyed = false;
  private markers: Marker[] = [];
  private bounds?: LngLatBounds;
  /** What the markers currently show; the labels are rebuilt from it on every selection. */
  private shown: { points: readonly MapPoint[]; center: MapCenter | undefined } = {
    points: [],
    center: undefined,
  };

  private readonly selectedId = computed(
    () => (this.props().selected?.value() as { id?: unknown } | undefined)?.id,
  );

  constructor() {
    afterNextRender(() => void this.createMap());
    effect(() => {
      const map = this.map();
      if (map === undefined) return;
      this.shown = {
        points: this.props().points.value() ?? [],
        center: this.props().center?.value(),
      };
      this.showMarkers(map);
      untracked(() => this.showSelection(map, this.selectedId()));
    });
    effect(() => {
      const map = this.map();
      if (map === undefined) return;
      this.showSelection(map, this.selectedId());
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.instance?.remove();
    });
  }

  private async createMap(): Promise<void> {
    setWorkerUrl(this.resources.workerUrl);
    const style = await this.resources.loadStyle().catch((error: unknown) => {
      console.warn('[maps] basemap style unavailable, showing markers only', error);
      return bareStyle();
    });
    if (this.destroyed) return;
    const map = new MapLibreMap({
      container: this.canvas().nativeElement,
      style,
      // The map sits in a scrolling transcript: the wheel scrolls the page, Ctrl + wheel zooms.
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    this.instance = map;
    map.once('style.load', () => {
      if (this.destroyed) return;
      map.addImage(DOT_BOX_IMAGE, dotBoxImage());
      map.addSource(LABELS_SOURCE, {
        type: 'geojson',
        data: labelCollection([], undefined, undefined),
      });
      for (const layer of labelLayers()) map.addLayer(layer);
      this.map.set(map);
    });
    // MapLibre tracks the container's size itself; a new size needs a new fit.
    map.on('resize', () => this.fit(map));
  }

  private showMarkers(map: MapLibreMap): void {
    const { points, center } = this.shown;
    for (const marker of this.markers) marker.remove();
    // The location shares the spread: a conference in the user's city stays visible beside it.
    const offsets = pixelOffsets(center === undefined ? points : [...points, center]);
    this.markers = points.map((point, index) =>
      createPointMarker(this.document, point, offsets[index], () => this.pick(point)).addTo(map),
    );
    if (center !== undefined) {
      this.markers.push(
        createCenterMarker(this.document, center, offsets[points.length]).addTo(map),
      );
    }
    this.bounds = boundsOf(points, center);
    this.fit(map);
  }

  /**
   * The selected dot gets the ink ring; its label turns bold and is placed first. A selection
   * made elsewhere (the timeline) must be in view: if the user has panned away, the map returns
   * to the overview. A click on the map itself never moves it, its point is in view already.
   */
  private showSelection(map: MapLibreMap, selectedId: unknown): void {
    for (const marker of this.markers) {
      const element = marker.getElement();
      const id = element.dataset['id'];
      element.classList.toggle('cf-selected', id !== undefined && id === selectedId);
    }
    const { points, center } = this.shown;
    map
      .getSource<GeoJSONSource>(LABELS_SOURCE)
      ?.setData(labelCollection(points, center, selectedId));
    const selected = points.find((point) => point.id === selectedId);
    if (selected !== undefined && !map.getBounds().contains([selected.lon, selected.lat])) {
      this.fit(map);
    }
  }

  private fit(map: MapLibreMap): void {
    if (this.bounds !== undefined) map.fitBounds(this.bounds, FIT_OPTIONS);
  }

  private pick(point: MapPoint): void {
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

function boundsOf(
  points: readonly MapPoint[],
  center: MapCenter | undefined,
): LngLatBounds | undefined {
  const coords: readonly { lat: number; lon: number }[] =
    center === undefined ? points : [...points, center];
  if (coords.length === 0) return undefined;
  const bounds = new LngLatBounds();
  for (const { lat, lon } of coords) bounds.extend([lon, lat]);
  return bounds;
}

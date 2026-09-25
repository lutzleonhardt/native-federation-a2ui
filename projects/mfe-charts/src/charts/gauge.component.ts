import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { BoundProperty } from '@a2ui/angular/v0_9';

/** Bound props as the renderer delivers them; mirrors `gaugeSchema`. */
export interface GaugeProps {
  readonly value: BoundProperty<number>;
  readonly max: BoundProperty<number>;
  readonly label?: BoundProperty<string>;
}

/** Length of the semicircular arc path (radius 40). */
const ARC_LENGTH = Math.PI * 40;

/** English whatever the browser language; one decimal at most ("2.4 %", "100 %"). */
const PERCENT = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

/**
 * Fill colour by share of the maximum: green above 65 %, yellow from 30 to 65 %, amber
 * below. Amber means scarce — the badge takes the attention style only there.
 */
type GaugeLevel = 'high' | 'mid' | 'low';
const MID_FROM = 0.3;
const HIGH_ABOVE = 0.65;

@Component({
  selector: 'app-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gauge.component.html',
  styleUrl: './gauge.component.css',
  host: { '[attr.data-level]': 'level()' },
})
export class GaugeComponent {
  /**
   * The a2ui component host binds all four inputs unconditionally — declare
   * them or its setInput reports unknown-input errors. A leaf like Gauge uses
   * only `props`; surfaceId/componentId/dataContextPath matter to containers.
   */
  readonly props = input.required<GaugeProps>();
  readonly surfaceId = input.required<string>();
  readonly componentId = input.required<string>();
  readonly dataContextPath = input<string>('/');

  protected readonly value = computed(() => this.props().value.value());
  protected readonly max = computed(() => this.props().max.value());
  protected readonly label = computed(() => this.props().label?.value());

  /** One truth for arc, level and percentage: value over max, clamped to 0..1. */
  private readonly fraction = computed(() => {
    const max = this.max();
    return max > 0 ? Math.min(Math.max(this.value() / max, 0), 1) : 0;
  });

  protected readonly dashArray = computed(
    () => `${(this.fraction() * ARC_LENGTH).toFixed(1)} ${ARC_LENGTH.toFixed(1)}`,
  );

  protected readonly level = computed<GaugeLevel>(() => {
    const fraction = this.fraction();
    return fraction > HIGH_ABOVE ? 'high' : fraction >= MID_FROM ? 'mid' : 'low';
  });

  protected readonly percent = computed(() => `${PERCENT.format(this.fraction() * 100)} %`);

  protected readonly ariaLabel = computed(
    () => `${this.label() ?? 'Gauge'}: ${this.value()} of ${this.max()}`,
  );
}

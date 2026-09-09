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

@Component({
  selector: 'app-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 70" role="img" [attr.aria-label]="ariaLabel()">
      <path d="M 10 52 A 40 40 0 0 1 90 52" fill="none" stroke="#e5e5e5" stroke-width="8" stroke-linecap="round" />
      <path
        d="M 10 52 A 40 40 0 0 1 90 52"
        fill="none"
        stroke="#3f51b5"
        stroke-width="8"
        stroke-linecap="round"
        [attr.stroke-dasharray]="dashArray()"
      />
      <text x="50" y="44" text-anchor="middle" class="cf-gauge-value">{{ value() }}</text>
      <text x="50" y="56" text-anchor="middle" class="cf-gauge-max">/ {{ max() }}</text>
      @if (label(); as caption) {
        <text x="50" y="67" text-anchor="middle" class="cf-gauge-label">{{ caption }}</text>
      }
    </svg>
  `,
  styles: `
    /* Explicit width: a viewBox-only svg has no intrinsic size, so inside the
       renderer's flex rows host and svg would both collapse to 0x0. */
    :host {
      display: block;
      width: 12rem;
    }
    svg {
      display: block;
      width: 100%;
    }
    .cf-gauge-value {
      font-size: 16px;
      font-weight: 600;
    }
    .cf-gauge-max {
      font-size: 8px;
      fill: #666;
    }
    .cf-gauge-label {
      font-size: 7px;
      fill: #666;
    }
  `,
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

  protected readonly dashArray = computed(() => {
    const max = this.max();
    const fraction = max > 0 ? Math.min(Math.max(this.value() / max, 0), 1) : 0;
    return `${(fraction * ARC_LENGTH).toFixed(1)} ${ARC_LENGTH.toFixed(1)}`;
  });

  protected readonly ariaLabel = computed(
    () => `${this.label() ?? 'Gauge'}: ${this.value()} of ${this.max()}`,
  );
}

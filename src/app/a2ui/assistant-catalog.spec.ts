import { BASIC_COMPONENTS } from '@a2ui/angular/v0_9';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chartsFragment } from '../capabilities/charts';
import { GaugeComponent } from '../capabilities/charts/gauge.component';
import { GAUGE_META } from '../capabilities/charts/gauge.schema';
import { mapsFragment } from '../capabilities/maps';
import { ASSISTANT_CATALOG_ID, createAssistantCatalog } from './assistant-catalog';
import type { CatalogFragment } from '../../../shared/capabilities/agent-capability';
import { createCustomComponent } from '../../../shared/capabilities/custom-component';

class SecondGauge {}

function fragmentWith(name: string): CatalogFragment {
  return {
    components: [createCustomComponent({ ...GAUGE_META, name, component: SecondGauge })],
    functions: [],
  };
}

describe('createAssistantCatalog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T4-AC-04 exposes all basic components plus Gauge under the assistant id', () => {
    const catalog = createAssistantCatalog([chartsFragment, mapsFragment]);

    expect(catalog.id).toBe(ASSISTANT_CATALOG_ID);
    for (const basic of BASIC_COMPONENTS) {
      expect(catalog.components.has(basic.name)).toBe(true);
    }
    expect(catalog.components.get('Gauge')?.component).toBe(GaugeComponent);
  });

  it('T4-AC-04 keeps the basic functions and adds daysUntil and distance', () => {
    const catalog = createAssistantCatalog([chartsFragment, mapsFragment]);

    expect(catalog.functions.has('formatDate')).toBe(true);
    expect(catalog.functions.has('daysUntil')).toBe(true);
    expect(catalog.functions.has('distance')).toBe(true);
  });

  it('T4-AC-04 warns on a duplicate component name across fragments and keeps the first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const catalog = createAssistantCatalog([chartsFragment, fragmentWith('Gauge')]);

    expect(catalog.components.get('Gauge')?.component).toBe(GaugeComponent);
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('"Gauge"'));
  });

  it('warns on a collision with a basic component name and keeps the basic one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const catalog = createAssistantCatalog([fragmentWith('Text')]);

    expect(catalog.components.get('Text')?.component).not.toBe(SecondGauge);
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('"Text"'));
  });
});

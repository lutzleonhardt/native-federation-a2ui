import { TestBed } from '@angular/core/testing';
import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { daysUntil } from '../charts/days-until.fn';
import { App, RELEASES } from './app';
import { appConfig } from './app.config';

describe('mfe-charts standalone page', () => {
  it('T4-AC-03: renders the charts vocabulary through its own A2UI host over release data', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelectorAll('g.cf-marker')).toHaveLength(RELEASES.length);
    expect(host.querySelector('app-gauge svg')?.textContent).toContain('21');
    expect(host.textContent).toContain('2.1');
    // The function call resolves through this host's catalog invoker; the basic Text
    // renders asynchronously, so the value arrives a tick after `whenStable`. Exact match on
    // the last Text of the summary column: the Gauge's numbers must not satisfy this.
    await vi.waitFor(() => {
      const texts = host.querySelectorAll('a2ui-v09-text');
      expect(texts[texts.length - 1].textContent?.trim()).toBe(String(daysUntil(RELEASES[1].date)));
    });
  });

  // The standalone stylesheet mirrors the shell's Row rules: wrap, and a content-sized Column.
  // With the wrap alone the Column's inline width: 100% claims the row and the summary always
  // drops under the gauge; without the stylesheet it would be squeezed beside it, row-wide.
  it('T8-AC-04: keeps the summary column beside the gauge at desktop width', async () => {
    await page.viewport(1280, 800);
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    const gauge = host.querySelector('app-gauge')!.getBoundingClientRect();
    const summary = host
      .querySelector('a2ui-v09-row > a2ui-v09-component-host > a2ui-v09-column')!
      .getBoundingClientRect();
    expect(summary.left).toBeGreaterThanOrEqual(gauge.right);
    expect(summary.width).toBeLessThan(gauge.width);
  });
});

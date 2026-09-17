import { TestBed } from '@angular/core/testing';
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
});

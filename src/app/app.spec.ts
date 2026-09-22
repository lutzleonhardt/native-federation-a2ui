import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('T1-AC-01 renders the root component in a real browser', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  // Guards the Browser-Mode setup: without `browsers` in angular.json the
  // unit-test builder silently falls back to jsdom and every DOM assertion
  // above would still pass.
  it('T1-AC-01 executes in headless Chromium, not jsdom', () => {
    expect(navigator.userAgent).toContain('HeadlessChrome');
  });
});

import { InjectionToken } from '@angular/core';

/** The page's query string as the browser reports it; specs provide their own. */
export const PAGE_SEARCH = new InjectionToken<string>('PAGE_SEARCH', {
  factory: () => location.search,
});

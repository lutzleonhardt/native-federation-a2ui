import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'playground',
    loadComponent: () => import('./playground/playground').then((m) => m.Playground),
  },
];

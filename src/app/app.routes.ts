import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'playground/tools',
    loadComponent: () => import('./playground/tool-playground').then((m) => m.ToolPlayground),
  },
  {
    path: 'playground',
    loadComponent: () => import('./playground/playground').then((m) => m.Playground),
  },
];

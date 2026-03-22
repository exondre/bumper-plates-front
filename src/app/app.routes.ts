import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'entrenamientos',
    loadComponent: () => import('./features/training/training-week-selector/training-week-selector.component').then(m => m.TrainingWeekSelectorComponent),
  },
  {
    path: 'marcas',
    loadComponent: () => import('./features/personal-records/personal-records.component').then(m => m.PersonalRecordsComponent),
  },
  {
    path: 'calculadora',
    loadComponent: () => import('./features/calculator/calculator-page.component').then(m => m.CalculatorPageComponent),
  },
  {
    path: 'configuraciones',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
];

import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { TrainingWeekSelectorComponent } from './features/training/training-week-selector/training-week-selector.component';
import { MarksComponent } from './features/marks/marks.component';
import { BumperPlatesCalculatorComponent } from './features/bumper-plates-calculator/bumper-plates-calculator.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'entrenamientos', component: TrainingWeekSelectorComponent },
  { path: 'marcas', component: MarksComponent },
  { path: 'calculadora', component: BumperPlatesCalculatorComponent },
  { path: 'configuraciones', component: SettingsComponent },
];

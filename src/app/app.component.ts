import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BumperPlatesCalculatorComponent } from './features/bumper-plates-calculator/bumper-plates-calculator.component';
import { PercentageCalculatorComponent } from './features/percentage-calculator/percentage-calculator.component';
import { PersonalRecordsComponent } from './features/personal-records/personal-records.component';
import { TrainingWeekSelectorComponent } from './features/training/training-week-selector/training-week-selector.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    BumperPlatesCalculatorComponent,
    PercentageCalculatorComponent,
    PersonalRecordsComponent,
    TrainingWeekSelectorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Bienvenido a Bumper Plates';
  subtitle = 'Tu app para ayudarte a levantar mejor 😉';
}

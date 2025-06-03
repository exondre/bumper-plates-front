import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BumperPlatesCalculatorComponent } from './bumper-plates-calculator/bumper-plates-calculator.component';
import { PercentageCalculatorComponent } from './percentage-calculator/percentage-calculator.component';
import { PersonalRecordsComponent } from './personal-records/personal-records.component';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, BumperPlatesCalculatorComponent, PercentageCalculatorComponent, PersonalRecordsComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Bienvenido a Bumper Plates';
  subtitle = 'Tu app para ayudarte a levantar mejor 😉';
}

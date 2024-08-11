import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BumperPlatesCalculatorComponent } from './bumper-plates-calculator/bumper-plates-calculator.component';
import { PercentageCalculatorComponent } from './percentage-calculator/percentage-calculator.component';
import { PersonalRecordsComponent } from './personal-records/personal-records.component';
import { NewPrComponent } from './personal-records/new-pr/new-pr.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BumperPlatesCalculatorComponent, PercentageCalculatorComponent, PersonalRecordsComponent, NewPrComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Bienvenido a Bumper Plates';
  subtitle = 'Tu app para ayudarte a levantar mejor 😉';
}

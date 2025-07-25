import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';

@Component({
  selector: 'app-calculator-page',
  standalone: true,
  imports: [CommonModule, BumperPlatesCalculatorComponent],
  template: `<app-bumper-plates-calculator [listenPercentageEventsInput]="false"></app-bumper-plates-calculator>`
})
export class CalculatorPageComponent {}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PersonalRecordsComponent } from '../personal-records/personal-records.component';
import { PercentageCalculatorComponent } from '../percentage-calculator/percentage-calculator.component';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';

@Component({
  selector: 'app-marks',
  imports: [
    CommonModule,
    PersonalRecordsComponent,
    PercentageCalculatorComponent,
    BumperPlatesCalculatorComponent,
  ],
  templateUrl: './marks.component.html',
  styleUrl: './marks.component.scss',
})
export class MarksComponent {}

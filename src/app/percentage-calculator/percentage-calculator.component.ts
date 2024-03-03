import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-percentage-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './percentage-calculator.component.html',
  styleUrl: './percentage-calculator.component.scss'
})
export class PercentageCalculatorComponent {
  personalRecord: number;
  percentages: any[];
  selectedUnit: string;

  constructor() {
    this.personalRecord = 150; // Default PR
    this.percentages = [
      {percentageName: '100%', percentageValue: 100, percentageWeight: 0},
      {percentageName: '95%', percentageValue: 95, percentageWeight: 0},
      {percentageName: '90%', percentageValue: 90, percentageWeight: 0},
      {percentageName: '85%', percentageValue: 85, percentageWeight: 0},
      {percentageName: '80%', percentageValue: 80, percentageWeight: 0},
      {percentageName: '75%', percentageValue: 75, percentageWeight: 0},
      {percentageName: '70%', percentageValue: 70, percentageWeight: 0},
      {percentageName: '65%', percentageValue: 65, percentageWeight: 0},
      {percentageName: '60%', percentageValue: 60, percentageWeight: 0},
      {percentageName: '55%', percentageValue: 55, percentageWeight: 0},
      {percentageName: '50%', percentageValue: 50, percentageWeight: 0},
    ];
    this.selectedUnit = 'lbs';
  }

  calculate() {
    this.percentages = this.calculatePercentages(this.personalRecord);
  }

  calculatePercentages(personalRecord: number) {
    this.percentages.map( p => p.percentageWeight = personalRecord * (p.percentageValue / 100));
    return this.percentages;
  }
}

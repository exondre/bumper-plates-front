import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-percentage-calculator',
    imports: [CommonModule, FormsModule],
    templateUrl: './percentage-calculator.component.html',
    styleUrl: './percentage-calculator.component.scss'
})
export class PercentageCalculatorComponent implements OnDestroy {
  selectedUnit: string;
  personalRecord: number;
  percentages: any[];
  selectedPRSubscription: Subscription;

  constructor(private sharedService: SharedService) {
    this.selectedUnit = 'lbs';
    this.personalRecord = 150; // Default PR
    this.percentages = [
      {percentageName: '115%', percentageValue: 115, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '110%', percentageValue: 110, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '105%', percentageValue: 105, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '100%', percentageValue: 100, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '95%', percentageValue: 95, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '90%', percentageValue: 90, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '85%', percentageValue: 85, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '80%', percentageValue: 80, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '75%', percentageValue: 75, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '70%', percentageValue: 70, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '65%', percentageValue: 65, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '60%', percentageValue: 60, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '55%', percentageValue: 55, percentageWeight: 0, unit: this.selectedUnit},
      {percentageName: '50%', percentageValue: 50, percentageWeight: 0, unit: this.selectedUnit},
    ];

    this.percentages.sort((a, b) => a.percentageValue - b.percentageValue);

    this.selectedPRSubscription = this.sharedService.getSelectedPREvent().subscribe( pr => this.setSelectedPR(pr) );
  }

  ngOnDestroy(): void {
      this.selectedPRSubscription.unsubscribe();
  }

  setSelectedPR(pr: any) {
    this.personalRecord = pr.record;
    this.selectedUnit = pr.recordUnit;
    this.calculate();
  }

  calculate() {
    this.percentages = this.calculatePercentages(this.personalRecord);
  }

  sendToPlatesCalculator(ev: MouseEvent, p: any) {
    ev.preventDefault();
    this.sharedService.sendSelectedPercentageEvent(p);
    // console.log(`${weight} ${unit}.`);
  }

  calculatePercentages(personalRecord: number) {
    this.percentages.map( p => {
      p.percentageWeight = personalRecord * (p.percentageValue / 100);
      p.unit = this.selectedUnit;
    });
    return this.percentages;
  }

  /**
   * Switches the unit of measurement for the personal record between pounds (lbs) and kilograms (kg).
   *
   * This method toggles the `selectedUnit` property between 'lbs' and 'kg'. It also updates the
   * `personalRecord` property by converting its value using the appropriate conversion factor
   * from the `sharedService`. Finally, it calls the `calculate` method to update any dependent calculations.
   */
  switchUnit() {
    this.personalRecord = this.selectedUnit === 'lbs' ? Math.round(this.personalRecord * this.sharedService.poundToKiloFactor) : Math.round(this.personalRecord * this.sharedService.kiloToPoundFactor);
    this.selectedUnit = this.selectedUnit === 'lbs' ? 'kg' : 'lbs';
    this.calculate();
  }
}

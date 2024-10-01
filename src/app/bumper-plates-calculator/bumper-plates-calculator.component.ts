import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SharedService } from '../service/shared.service';

@Component({
  selector: 'app-bumper-plates-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bumper-plates-calculator.component.html',
  styleUrls: ['./bumper-plates-calculator.component.scss'],
})
export class BumperPlatesCalculatorComponent implements OnDestroy {
  initialWeight: number;
  desiredWeight: number;
  requiredBumpers: any[];
  achievedWeight: number;
  extraWeight: number;
  initialWeightUnit: string;
  desiredWeightUnit: string;
  selectedPercentageSuscription: Subscription;

  constructor(private sharedService: SharedService) {
    this.initialWeight = 20; // Default bar weight
    this.desiredWeight = 100; // Default desired weight
    this.requiredBumpers = [];
    this.achievedWeight = 0;
    this.extraWeight = 0;
    this.initialWeightUnit = 'kg';
    this.desiredWeightUnit = 'lbs';

    this.selectedPercentageSuscription = this.sharedService.getSelectedPercentageEvent().subscribe(p => {
      // Perform actions based on the received data
      // console.log(p);
      this.desiredWeight = p.percentageWeight;
      this.desiredWeightUnit = p.unit;
      this.calculate();
    });
  }

  ngOnDestroy(): void {
    this.selectedPercentageSuscription.unsubscribe();
  }

  calculate() {
    // Implement your calculation logic here
    // Assign values to bumpersNecessary, achievedWeight, and extraWeight

    const result = this.calculateBumpers(this.initialWeight, this.initialWeightUnit, this.desiredWeight, this.desiredWeightUnit);
    this.requiredBumpers = result.requiredBumpers;
    this.achievedWeight = result.achievedWeight;
    this.extraWeight = result.extraWeight;
  }

  switchDesiredToInitial() {
    this.initialWeight = this.desiredWeight;
    this.initialWeightUnit = this.desiredWeightUnit;
    this.desiredWeight = 0;
  }

  /**
   * Calculate the required bumpers to achieve the desired weight on a barbell.
   * @param {number} initialWeight - The initial weight, might be the barbell or otherwise, in kilograms or pounds.
   * @param {string} initialUnit - The unit of initial weight, either 'kg' for kilograms or 'lbs' for pounds.
   * @param {number} desiredWeight - The desired total weight on the barbell in kilograms or pounds.
   * @param {string} desiredUnit - The unit of desired weight, either 'kg' for kilograms or 'lbs' for pounds.
   * @returns {object} An object containing the necessary bumpers, the achieved weight, and the extra weight.
   */
  calculateBumpers(initialWeight: number, initialUnit: string, desiredWeight: number, desiredUnit: string) {
    let availableBumpers = [
      { bumperName: '20 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 20, bumperLimit: 1 },
      { bumperName: '15 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 15, bumperLimit: 1 },
      { bumperName: '10 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 10, bumperLimit: 1 },
      { bumperName: '5 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 5, bumperLimit: 2 },
      { bumperName: '45 lbs', bumperUnit: 'lbs', bumperOriginalUnit: 'lbs', bumperValue: 45, bumperLimit: 0 },
      { bumperName: '35 lbs', bumperUnit: 'lbs', bumperOriginalUnit: 'lbs', bumperValue: 35, bumperLimit: 0 },
      { bumperName: '25 lbs', bumperUnit: 'lbs', bumperOriginalUnit: 'lbs', bumperValue: 25, bumperLimit: 0 },
      { bumperName: '15 lbs', bumperUnit: 'lbs', bumperOriginalUnit: 'lbs', bumperValue: 15, bumperLimit: 0 },
      { bumperName: '10 lbs', bumperUnit: 'lbs', bumperOriginalUnit: 'lbs', bumperValue: 10, bumperLimit: 0 },
      { bumperName: '2.5 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 2.5, bumperLimit: 0 },
      { bumperName: '2 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 2, bumperLimit: 0 },
      { bumperName: '1.5 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 1.5, bumperLimit: 0 },
      { bumperName: '1 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 1, bumperLimit: 0 },
      { bumperName: '0.5 kg', bumperUnit: 'kg', bumperOriginalUnit: 'kg', bumperValue: 0.5, bumperLimit: 0 },
    ];

    if (initialUnit === 'lbs') {
      initialWeight *= this.sharedService.poundToKiloFactor; // Convert to kilograms
    }

    // Convert the desired weight to the same unit as the barbell
    if (desiredUnit === 'lbs') {
      desiredWeight *= this.sharedService.poundToKiloFactor; // Convert to kilograms

      // Filter out bigger bumpers measured in kilograms
      availableBumpers = availableBumpers.filter((bumper) => bumper.bumperOriginalUnit === 'lbs' || bumper.bumperOriginalUnit === 'kg' && bumper.bumperValue < 5);
    }

    // Calculate the total desired weight
    let totalDesiredWeight = (desiredWeight - initialWeight) / 2;

    // Convert the bumper values to kilograms if the unit is in pounds
    availableBumpers.forEach((bumper) => {
      if (bumper.bumperUnit === 'lbs') {
        bumper.bumperValue *= this.sharedService.poundToKiloFactor;
        bumper.bumperUnit = 'kg';
      }
    });

    // Initialize variables
    let requiredBumpers = [];
    let remainingWeight = totalDesiredWeight;
    let achievedWeight = 0;
    const tolerance = 0.5; // Define a tolerance of 1 kilogram

    // Sort the available bumpers in descending order of weight
    availableBumpers.sort((a, b) => {
      if (a.bumperOriginalUnit === 'kg' && a.bumperValue >= 5 && b.bumperOriginalUnit === 'kg' && b.bumperValue >= 5) {
        return b.bumperValue - a.bumperValue;
      }
      if (a.bumperOriginalUnit === 'kg' && a.bumperValue >= 5 && b.bumperOriginalUnit === 'lbs') {
        return -1; // a takes precedence
      }
      if (b.bumperOriginalUnit === 'kg' && b.bumperValue >= 5 && a.bumperOriginalUnit === 'lbs') {
        return 1; // b takes precedence
      }
      return b.bumperValue - a.bumperValue; // Sort by bumperValue in descending order
    });

    // Iterate over the available bumpers
    for (let bumper of availableBumpers) {
      // Calculate the number of bumpers required
      let quantity = Math.round(remainingWeight / bumper.bumperValue);

      // Validate if the quantity exceeds the allowed tolerance
      if (quantity * bumper.bumperValue - remainingWeight > tolerance) {
        // If it exceeds the tolerance, subtract 1 from the quantity
        quantity -= 1;
      }

      if (bumper.bumperLimit > 0 && quantity > bumper.bumperLimit) {
        // If the quantity exceeds the limit, set it to the limit

        console.log('got here');
        console.log(quantity);

        quantity = bumper.bumperLimit;
      }

      // Add bumpers to the list
      if (quantity > 0) {
        requiredBumpers.push({ ...bumper, quantity });
        // Update the remaining weight
        remainingWeight -= quantity * bumper.bumperValue;
        // Update the achieved weight
        achievedWeight += bumper.bumperValue * quantity;
      }
    }

    const totalAchievedWeight = achievedWeight * 2 + initialWeight;

    // Return the required bumpers, the achieved weight, and the remaining weight
    return {
      requiredBumpers,
      achievedWeight:
        desiredUnit === 'lbs'
          ? totalAchievedWeight * this.sharedService.kiloToPoundFactor
          : totalAchievedWeight,
      extraWeight: remainingWeight * -1,
    };
  }
}

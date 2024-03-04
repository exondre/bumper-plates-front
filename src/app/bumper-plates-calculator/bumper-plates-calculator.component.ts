import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bumper-plates-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bumper-plates-calculator.component.html',
  styleUrls: ['./bumper-plates-calculator.component.scss'],
})
export class BumperPlatesCalculatorComponent {
  initialWeight: number;
  desiredWeight: number;
  requiredBumpers: any[];
  achievedWeight: number;
  extraWeight: number;
  initialWeightUnit: string;
  desiredWeightUnit: string;

  constructor() {
    this.initialWeight = 20; // Default bar weight
    this.desiredWeight = 100; // Default desired weight
    this.requiredBumpers = [];
    this.achievedWeight = 0;
    this.extraWeight = 0;
    this.initialWeightUnit = 'kg';
    this.desiredWeightUnit = 'lbs';
  }

  calculate() {
    // Implement your calculation logic here
    // Assign values to bumpersNecessary, achievedWeight, and extraWeight

    const result = this.calculateBumpers(this.initialWeight, this.initialWeightUnit, this.desiredWeight, this.desiredWeightUnit);
    this.requiredBumpers = result.requiredBumpers;
    this.achievedWeight = result.achievedWeight;
    this.extraWeight = result.extraWeight;
  }

  /**
   * Calculate the required bumpers to achieve the desired weight on a barbell.
   * @param {number} initialWeight - The initial weight, might be the barbell or otherwise, in kilograms or pounds.
   * @param {string} initialUnit - The unit of initial weight, either 'kg' for kilograms or 'lbs' for pounds.
   * @param {number} desiredWeight - The desired total weight on the barbell in kilograms or pounds.
   * @param {string} desiredUnit - The unit of desired weight, either 'kg' for kilograms or 'lbs' for pounds.
   * @returns {object} An object containing the necessary bumpers, the achieved weight, and the extra weight.
   */
  calculateBumpers(initialWeight: number, initialUnit:string , desiredWeight: number, desiredUnit: string) {
    const availableBumpers = [
      { bumperName: '45 lbs', bumperUnit: 'lbs', bumperValue: 45 },
      { bumperName: '35 lbs', bumperUnit: 'lbs', bumperValue: 35 },
      { bumperName: '25 lbs', bumperUnit: 'lbs', bumperValue: 25 },
      { bumperName: '15 lbs', bumperUnit: 'lbs', bumperValue: 15 },
      { bumperName: '10 lbs', bumperUnit: 'lbs', bumperValue: 10 },
      { bumperName: '2.5 kg', bumperUnit: 'kg', bumperValue: 2.5 },
      { bumperName: '2 kg', bumperUnit: 'kg', bumperValue: 2 },
      { bumperName: '1.5 kg', bumperUnit: 'kg', bumperValue: 1.5 },
      { bumperName: '1 kg', bumperUnit: 'kg', bumperValue: 1 },
      { bumperName: '0.5 kg', bumperUnit: 'kg', bumperValue: 0.5 },
    ];

    const poundToKiloFactor = 0.453592;
    const kiloToPoundFactor = 2.20462;

    if (initialUnit === 'lbs') {
      initialWeight *= poundToKiloFactor; // Convert to kilograms
    }

    // Convert the desired weight to the same unit as the barbell
    if (desiredUnit === 'lbs') {
      desiredWeight *= poundToKiloFactor; // Convert to kilograms
    }

    // Calculate the total desired weight
    let totalDesiredWeight = (desiredWeight - initialWeight) / 2;

    // Convert the bumper values to kilograms if the unit is in pounds
    availableBumpers.forEach((bumper) => {
      if (bumper.bumperUnit === 'lbs') {
        bumper.bumperValue *= poundToKiloFactor;
        bumper.bumperUnit = 'kg';
      }
    });

    // Initialize variables
    let requiredBumpers = [];
    let remainingWeight = totalDesiredWeight;
    let achievedWeight = 0;
    const tolerance = 0.5; // Define a tolerance of 1 kilogram

    // Sort the available bumpers in descending order of weight
    availableBumpers.sort((a, b) => b.bumperValue - a.bumperValue);

    // Iterate over the available bumpers
    for (let bumper of availableBumpers) {
      // Calculate the number of bumpers required
      let quantity = Math.round(remainingWeight / bumper.bumperValue);

      // Validate if the quantity exceeds the allowed tolerance
      if (quantity * bumper.bumperValue - remainingWeight > tolerance) {
        // If it exceeds the tolerance, subtract 1 from the quantity
        quantity -= 1;
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
          ? totalAchievedWeight * kiloToPoundFactor
          : totalAchievedWeight,
      extraWeight: remainingWeight * -1,
    };
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { PersonalRecordsComponent } from '../personal-records/personal-records.component';
import { PercentageCalculatorComponent } from '../percentage-calculator/percentage-calculator.component';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';

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
export class MarksComponent implements OnDestroy {
  showPercentageCalc = false;
  showPlatesCalc = false;

  private prSub: Subscription;
  private percSub: Subscription;

  constructor(private sharedService: SharedService) {
    this.prSub = this.sharedService
      .getSelectedPREvent()
      .subscribe(() => {
        this.showPercentageCalc = true;
        this.showPlatesCalc = false;
      });
    this.percSub = this.sharedService
      .getSelectedPercentageEvent()
      .subscribe(() => {
        this.showPlatesCalc = true;
      });
  }

  ngOnDestroy(): void {
    this.prSub.unsubscribe();
    this.percSub.unsubscribe();
  }
}

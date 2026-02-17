
import { Component, OnDestroy } from '@angular/core';
import { PersonalRecordsComponent } from '../personal-records/personal-records.component';
import { PercentageCalculatorComponent } from '../percentage-calculator/percentage-calculator.component';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-marks',
  imports: [
    PersonalRecordsComponent,
],
  templateUrl: './marks.component.html',
  styleUrl: './marks.component.scss',
})
export class MarksComponent {
}

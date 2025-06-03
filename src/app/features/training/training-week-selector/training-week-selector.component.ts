import {
  Component,
} from '@angular/core';
import {
  TrainingExercise,
  TrainingSession,
  TrainingSet,
  TrainingWeek,
} from '../training.interface';
import { PersonalRecord } from '../../../personal-records/personal-record.interface';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { BumperPlatesCalculatorComponent } from '../../../bumper-plates-calculator/bumper-plates-calculator.component';

@Component({
  selector: 'app-training-week-selector',
  imports: [BumperPlatesCalculatorComponent],
  templateUrl: './training-week-selector.component.html',
  styleUrl: './training-week-selector.component.scss',
})
export class TrainingWeekSelectorComponent {
  storedWeeks: TrainingWeek[] = [];
  selectedWeek?: TrainingWeek;
  selectedSession?: TrainingSession;

  initialWeight: number = 20; // Peso inicial por defecto
  initialWeightUnit: string = 'kg'; // Unidad de peso por defecto

  personalRecords: PersonalRecord[] = [];
  selectedCalculator: {
    exercise: TrainingExercise;
    set: TrainingSet;
  } | null = null;

  ngOnInit() {
    // Ajusta LSKeysEnum.BP_TRAINING_WEEKS según tu código real
    this.storedWeeks = JSON.parse(
      localStorage.getItem(LSKeysEnum.BP_TRAINING_WEEKS) || '[]'
    );
    this.personalRecords = JSON.parse(
      localStorage.getItem(LSKeysEnum.PERSONAL_RECORDS) || '[]'
    );
  }

  selectWeek(week: TrainingWeek) {
    this.selectedWeek = week;
    this.selectedSession = undefined;
  }

  selectSession(session: TrainingSession) {
    this.selectedSession = session;
  }

  getPersonalRecordForType(
    exerciseType: ExerciseEnum
  ): PersonalRecord | undefined {
    const pr = this.personalRecords.find(
      (record) => record.exerciseType === exerciseType
    );
    return pr;
  }

  openCalculatorForSet(exercise: TrainingExercise, set: TrainingSet) {
    this.selectedCalculator = { exercise, set };
  }

  closeCalculator() {
    this.selectedCalculator = null;
  }
}

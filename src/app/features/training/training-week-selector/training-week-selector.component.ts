import { Component, OnDestroy } from '@angular/core';
import { LocalStorageService } from '../../../service/local-storage.service';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { WeightUnitEnum } from '../../../shared/enums/weight-unit.enum';
import { BumperPlatesCalculatorComponent } from '../../bumper-plates-calculator/bumper-plates-calculator.component';
import { PersonalRecord } from '../../personal-records/personal-record.interface';
import { TrainingCsvLoaderComponent } from '../training-csv-loader/training-csv-loader.component';
import {
  TrainingExercise,
  TrainingSession,
  TrainingSet,
  TrainingWeek,
} from '../training.interface';
import { TrainingService } from '../training.service';
import { SharedService } from '../../../service/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-training-week-selector',
  imports: [BumperPlatesCalculatorComponent, TrainingCsvLoaderComponent],
  templateUrl: './training-week-selector.component.html',
  styleUrl: './training-week-selector.component.scss',
})
export class TrainingWeekSelectorComponent implements OnDestroy {
  storedWeeks: TrainingWeek[] = [];
  selectedWeek?: TrainingWeek;
  selectedSession?: TrainingSession;

  initialWeight: number = 20; // Peso inicial por defecto
  initialWeightUnit: string = 'kg'; // Unidad de peso por defecto

  barbellList: { value: number; unit: WeightUnitEnum }[] = [
    { value: 20, unit: WeightUnitEnum.KG },
    { value: 15, unit: WeightUnitEnum.KG },
    { value: 45, unit: WeightUnitEnum.LBS },
    { value: 35, unit: WeightUnitEnum.LBS },
  ];
  selectedBarbell: { value: number; unit: string } | null = null;

  showWeekLoader: boolean = false;

  personalRecords: PersonalRecord[] = [];
  selectedCalculator: {
    exercise: TrainingExercise;
    set: TrainingSet;
  } | null = null;

  private weekSub: Subscription;
  private sessionSub: Subscription;

  constructor(
    private localStorageService: LocalStorageService,
    private trainingService: TrainingService,
    private sharedService: SharedService
  ) {
    this.weekSub = this.sharedService
      .getSelectedWeek()
      .subscribe((w) => (this.selectedWeek = w || undefined));
    this.sessionSub = this.sharedService
      .getSelectedSession()
      .subscribe((s) => (this.selectedSession = s || undefined));
  }

  ngOnInit() {
    // Ajusta LSKeysEnum.BP_TRAINING_WEEKS según tu código real
    const firstLoadAttempt = this.trainingService.getTrainingDataOnAppLoad();
    if (firstLoadAttempt.error) {
      const confirmMsg = `
Detectamos un problema con tus datos de entrenamiento.
Podemos intentar recuperar parte de la información, pero es posible que algunos datos se pierdan definitivamente.
Si eliges no recuperar, podrás seguir usando la app, pero algunas funcionalidades estarán desactivadas hasta que resuelvas este problema.

¿Deseas intentar recuperar tus datos?
`;
      if (confirm(confirmMsg)) {
        this.trainingService.purgeCorruptedData();
        this.storedWeeks = this.trainingService.getTrainingData();
      }
    } else {
      this.storedWeeks = firstLoadAttempt.data;
    }

    this.personalRecords =
      JSON.parse(
        this.localStorageService.getItem(LSKeysEnum.PERSONAL_RECORDS)
      ) || '[]';
  }

  selectWeek(week: TrainingWeek) {
    if (this.selectedWeek === week) {
      this.selectedWeek = undefined; // Deselect if already selected
      this.selectedSession = undefined;
      this.sharedService.setSelectedWeek(null);
      this.sharedService.setSelectedSession(null);
      return;
    }

    this.selectedWeek = week;
    this.selectedSession = undefined;
    this.sharedService.setSelectedWeek(week);
    this.sharedService.setSelectedSession(null);
  }

  deleteWeek(week: TrainingWeek) {
    if (!confirm('¿Seguro que deseas eliminar esta semana completa?')) return;

    this.storedWeeks = this.storedWeeks.filter((w) => w !== week);

    // Limpia selección si corresponde
    if (this.selectedWeek === week) {
      this.selectedWeek = undefined;
      this.selectedSession = undefined;
    }

    // Persiste en localStorage
    localStorage.setItem(
      LSKeysEnum.BP_TRAINING_WEEKS,
      JSON.stringify(this.storedWeeks)
    );
  }

  addWeek() {
    this.showWeekLoader = true;
  }

  listenToLoadingDone(updatedWeeks?: TrainingWeek[]) {
    if (updatedWeeks) {
      this.storedWeeks = updatedWeeks;
    }
    this.showWeekLoader = false;
  }

  selectSession(session: TrainingSession) {
    if (this.selectedSession === session) {
      this.selectedSession = undefined; // Deselect if already selected
      this.sharedService.setSelectedSession(null);
      return;
    }
    this.selectedSession = session;
    this.sharedService.setSelectedSession(session);
  }

  selectBarbell(barbell: { value: number; unit: string }) {
    this.selectedBarbell = barbell;
    this.closeCalculator();
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
    this.closeCalculator();

    setTimeout(() => {
      this.selectedCalculator = { exercise, set };
    });
  }

  closeCalculator() {
    this.selectedCalculator = null;
  }

  getDesiredWeightForSet(pr: PersonalRecord, set: TrainingSet, barbellWeightUnit: WeightUnitEnum | string): number {
    const desiredWeight = pr && set?.weightPercent ? (pr?.record! * set?.weightPercent! / 100) : pr?.record ?? 20;

    if (barbellWeightUnit === WeightUnitEnum.KG.toString() && pr.recordUnit === WeightUnitEnum.LBS) {
      // Convertir de lbs a kg
      return +(desiredWeight * this.sharedService.poundToKiloFactor).toFixed(2);
    }

    if (barbellWeightUnit === WeightUnitEnum.LBS.toString() && pr.recordUnit === WeightUnitEnum.KG) {
      // Convertir de kg a lbs
      return +(desiredWeight * this.sharedService.kiloToPoundFactor).toFixed(2);
    }

    return desiredWeight;
  }

  ngOnDestroy(): void {
    this.sharedService.setSelectedWeek(this.selectedWeek ?? null);
    this.sharedService.setSelectedSession(this.selectedSession ?? null);
    this.weekSub.unsubscribe();
    this.sessionSub.unsubscribe();
  }
}

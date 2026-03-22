// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TrainingSession, TrainingWeek } from '../features/training/training.interface';
import { LocalStorageService } from './local-storage.service';
import { LSKeysEnum } from '../shared/enums/LSKeysEnum';
import { Preferences } from '../shared/interfaces/preferences.interface';
import { PersonalRecord } from '../features/personal-records/personal-record.interface';
import { WeightUnitEnum } from '../shared/enums/weight-unit.enum';
import { ExerciseEnum } from '../shared/enums/ExerciseEnum';

export interface MarksViewCalculatorState {
  exercise: ExerciseEnum;
  percentage: number;
}

export interface MarksViewState {
  selectedRecordKey: string | null;
  selectedPercentage: number | null;
  selectedCalculator: MarksViewCalculatorState | null;
  scrollTop: number;
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private selectedPercentage = new BehaviorSubject<any>(null);
  private showNewPR = new Subject<any>();
  private reloadPR = new Subject<boolean>();
  private selectedPR = new BehaviorSubject<any>(null);
  private marksViewState = new BehaviorSubject<MarksViewState>({
    selectedRecordKey: null,
    selectedPercentage: null,
    selectedCalculator: null,
    scrollTop: 0,
  });
  private selectedWeek = new BehaviorSubject<TrainingWeek | null>(null);
  private selectedSession = new BehaviorSubject<TrainingSession | null>(null);
  private preferences = new BehaviorSubject<Preferences>({
    showAllPersonalRecords: false,
  });

  readonly poundToKiloFactor = 0.453592;
  readonly kiloToPoundFactor = 2.20462;

  constructor(private lsService: LocalStorageService) {
    this.loadPreferences();
  }

  sendSelectedPercentageEvent(data: any) {
    this.selectedPercentage.next(data);
  }

  getSelectedPercentageEvent() {
    return this.selectedPercentage.asObservable();
  }

  sendShowNewPR(data: any) {
    this.showNewPR.next(data);
  }

  getShowNewPR() {
    return this.showNewPR.asObservable();
  }

  sendReloadPR() {
    this.reloadPR.next(true);
  }

  getReloadPR() {
    return this.reloadPR.asObservable();
  }

  sendSelectedPREvent(data: any) {
    this.selectedPR.next(data);
  }

  getSelectedPREvent() {
    return this.selectedPR.asObservable();
  }

  /**
   * Returns an observable with the in-memory state for the marks tab.
   */
  getMarksViewState() {
    return this.marksViewState.asObservable();
  }

  /**
   * Returns the current in-memory marks tab state snapshot.
   */
  getMarksViewStateSnapshot(): MarksViewState {
    return this.marksViewState.value;
  }

  /**
   * Patches the in-memory marks tab state.
   */
  patchMarksViewState(patch: Partial<MarksViewState>): void {
    this.marksViewState.next({
      ...this.marksViewState.value,
      ...patch,
    });
  }

  /**
   * Resets the in-memory marks tab state.
   */
  resetMarksViewState(): void {
    this.marksViewState.next({
      selectedRecordKey: null,
      selectedPercentage: null,
      selectedCalculator: null,
      scrollTop: 0,
    });
  }

  setSelectedWeek(week: TrainingWeek | null) {
    this.selectedWeek.next(week);
  }

  getSelectedWeek() {
    return this.selectedWeek.asObservable();
  }

  setSelectedSession(session: TrainingSession | null) {
    this.selectedSession.next(session);
  }

  getSelectedSession() {
    return this.selectedSession.asObservable();
  }

  /**
   * Returns an observable with the current persisted preferences.
   */
  getPreferences() {
    return this.preferences.asObservable();
  }

  /**
   * Updates user preferences and persists them to local storage.
   */
  updatePreferences(nextPreferences: Partial<Preferences>): void {
    const updatedPreferences = {
      ...this.preferences.value,
      ...nextPreferences,
    };
    this.preferences.next(updatedPreferences);
    this.persistPreferences(updatedPreferences);
  }

  /**
   * Loads user preferences from local storage.
   */
  private loadPreferences(): void {
    const storedValue = this.lsService.getItem(LSKeysEnum.BP_PREFERENCES);
    if (!storedValue) {
      return;
    }

    try {
      const parsedPreferences = JSON.parse(storedValue) as Preferences;
      this.preferences.next({
        ...this.preferences.value,
        ...parsedPreferences,
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Persists user preferences to local storage.
   */
  private persistPreferences(preferences: Preferences): void {
    this.lsService.setItem(LSKeysEnum.BP_PREFERENCES, JSON.stringify(preferences));
  }

  getDesiredWeightForPercentage(pr: PersonalRecord, percentage: number, barbellWeightUnit: WeightUnitEnum | string): number {
    const desiredWeight = pr && percentage ? (pr?.record! * percentage! / 100) : pr?.record ?? 20;

    if (barbellWeightUnit === WeightUnitEnum.KG.toString() && pr.recordUnit === WeightUnitEnum.LBS) {
      // Convertir de lbs a kg
      return +(desiredWeight * this.poundToKiloFactor).toFixed(2);
    }

    if (barbellWeightUnit === WeightUnitEnum.LBS.toString() && pr.recordUnit === WeightUnitEnum.KG) {
      // Convertir de kg a lbs
      return +(desiredWeight * this.kiloToPoundFactor).toFixed(2);
    }

    return desiredWeight;
  }
}

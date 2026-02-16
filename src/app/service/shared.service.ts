// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TrainingSession, TrainingWeek } from '../features/training/training.interface';
import { LocalStorageService } from './local-storage.service';
import { LSKeysEnum } from '../shared/enums/LSKeysEnum';
import { Preferences } from '../shared/interfaces/preferences.interface';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private selectedPercentage = new BehaviorSubject<any>(null);
  private showNewPR = new Subject<any>();
  private reloadPR = new Subject<boolean>();
  private selectedPR = new BehaviorSubject<any>(null);
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
}

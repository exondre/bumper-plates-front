import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';
import { LocalStorageService } from '../../service/local-storage.service';
import { SharedService } from '../../service/shared.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { WeightUnitEnum } from '../../shared/enums/weight-unit.enum';
import { NewPrComponent } from './new-pr/new-pr.component';
import { PersonalRecord } from './personal-record.interface';

@Component({
  selector: 'app-personal-records',
  imports: [CommonModule, BumperPlatesCalculatorComponent, NewPrComponent],
  templateUrl: './personal-records.component.html',
  styleUrl: './personal-records.component.scss',
})
export class PersonalRecordsComponent implements OnDestroy, OnInit {
  private sharedService = inject(SharedService);

  personalRecords: PersonalRecord[] = [];
  showNewPR: boolean = false;
  showAllRecords: boolean = false;
  editingRecord: PersonalRecord | null = null;
  showNewPRSubscription: Subscription;
  reloadPRSubscription: Subscription;
  preferencesSubscription: Subscription = new Subscription();
  selectedPR: PersonalRecord | null = null;

  percentageList = [
    { label: '50%', value: 50 },
    { label: '55%', value: 55 },
    { label: '60%', value: 60 },
    { label: '65%', value: 65 },
    { label: '70%', value: 70 },
    { label: '75%', value: 75 },
    { label: '80%', value: 80 },
    { label: '85%', value: 85 },
    { label: '90%', value: 90 },
    { label: '95%', value: 95 },
    { label: '100%', value: 100 },
    { label: '105%', value: 105 },
  ];

  selectedBarbell: { value: number; unit: WeightUnitEnum } | null = null;

  /** User's preferred weight unit for plates suggestions. */
  preferredPlatesUnit?: WeightUnitEnum;

  private preferencesSub: Subscription = new Subscription();
  private readonly calculatorPanelSelector = '[data-marks-calculator-panel="true"]';

  constructor(
    private lsService: LocalStorageService,
  ) {
    this.showNewPRSubscription = this.sharedService.getShowNewPR().subscribe(s => {
      this.showNewPR = s;
      if (!s) {
        this.editingRecord = null;
      }
    });

    this.reloadPRSubscription = this.sharedService.getReloadPR().subscribe(r => {
      if (r) {
        this.loadPersonalRecords();
      }
    });
  }

  ngOnInit(): void {
    this.preferencesSubscription = this.sharedService.getPreferences().subscribe(preferences => {
      this.showAllRecords = Boolean(preferences.showAllPersonalRecords);
    });
    this.loadPersonalRecords();

    this.preferencesSub = this.sharedService.getPreferences().subscribe(preferences => {
      if (preferences.preferredBarbell) {
        this.selectedBarbell = preferences.preferredBarbell;
      } else if (!this.selectedBarbell) {
        this.selectedBarbell = { value: 20, unit: WeightUnitEnum.KG };
      }

      this.preferredPlatesUnit = preferences.preferredPlatesUnits;
    });

  }

  ngOnDestroy(): void {
    this.showNewPRSubscription.unsubscribe();
    this.reloadPRSubscription.unsubscribe();
    this.preferencesSubscription.unsubscribe();
    this.preferencesSub.unsubscribe();
  }

  addNewPR(): void {
    this.editingRecord = null;
    this.showNewPR = true;
  }

  editPR(pr: PersonalRecord): void {
    this.editingRecord = pr;
    this.showNewPR = true;
  }

  deletePR(pr: PersonalRecord): void {
    const confirmed = window.confirm(`¿Borrar "${pr.recordName}"?`);
    if (!confirmed) {
      return;
    }
    const newPR = this.personalRecords.filter((p: PersonalRecord) => p !== pr);
    this.lsService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(newPR));
    this.loadPersonalRecords();
  }

  loadPersonalRecords(): void {
    const storedValue = this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const parsedRecords: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    this.personalRecords = this.sortPersonalRecords(parsedRecords);
    this.restoreMarksViewState();
  }

  /**
    * Updates the personal records visibility preference.
   */
  onShowAllRecordsToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.sharedService.updatePreferences({
      showAllPersonalRecords: input.checked,
    });
  }

  sendToPercentageCalculator(ev: MouseEvent, p: PersonalRecord): void {
    ev.preventDefault();
    this.sharedService.sendSelectedPREvent(p);
    this.selectPR(p);
  }

  /**
   * Selects a personal record and clears percentage/calculator selections when switching records.
   */
  selectPR(pr: PersonalRecord): void {
    const recordKey = this.getPersonalRecordKey(pr);
    const isAlreadySelected = this.selectedRecordKey === recordKey;

    if (isAlreadySelected) {
      this.selectedPR = null;
      this.sharedService.patchMarksViewState({
        selectedRecordKey: null,
        selectedPercentage: null,
        selectedCalculator: null,
      });
      return;
    }

    this.selectedPR = pr;
    this.sharedService.patchMarksViewState({
      selectedRecordKey: recordKey,
      selectedPercentage: null,
      selectedCalculator: null,
    });
  }

  /**
   * Opens the bumpers calculator for the selected record and percentage.
   */
  openCalculatorForPRAndPercentage(pr: PersonalRecord, percentage: number): void {
    if (this.selectedPercentage === percentage) {
      this.sharedService.patchMarksViewState({
        selectedPercentage: null,
        selectedCalculator: null,
      });
      return;
    }

    this.selectedPR = pr;
    this.sharedService.patchMarksViewState({
      selectedRecordKey: this.getPersonalRecordKey(pr),
      selectedPercentage: percentage,
      selectedCalculator: {
        exercise: pr.exerciseType!,
        percentage,
      },
    });

    this.scrollCalculatorPanelIfNeeded();
  }

  /**
   * Closes the bumpers calculator while keeping the selected record in memory.
   */
  closeCalculator(): void {
    this.sharedService.patchMarksViewState({
      selectedCalculator: null,
    });
  }

  /**
   * Scrolls the active calculator panel toward the viewport center when it is outside the comfortable area.
   */
  private scrollCalculatorPanelIfNeeded(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const calculatorPanel = document.querySelector<HTMLElement>(this.calculatorPanelSelector);
        if (!calculatorPanel) {
          return;
        }

        const panelRect = calculatorPanel.getBoundingClientRect();
        if (this.isPanelWithinComfortableViewportZone(panelRect)) {
          return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        calculatorPanel.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
    });
  }

  /**
   * Determines whether the panel center is already located inside the comfortable viewport range.
   */
  private isPanelWithinComfortableViewportZone(panelRect: DOMRect): boolean {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const comfortableTop = viewportHeight * 0.25;
    const comfortableBottom = viewportHeight * 0.65;
    const panelCenter = panelRect.top + (panelRect.height / 2);

    return panelCenter >= comfortableTop && panelCenter <= comfortableBottom;
  }

  /**
   * Sorts personal records prioritizing snatch, clean & jerk, and then remaining entries alphabetically.
   * Records within the same exercise type are ordered by recency.
   */
  private sortPersonalRecords(records: PersonalRecord[]): PersonalRecord[] {
    const toTimestamp = (record: PersonalRecord): number => {
      const rawDate = record.date;
      if (!rawDate) {
        return Number.NEGATIVE_INFINITY;
      }

      const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
      const timestamp = parsedDate.getTime();
      return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
    };

    const exercisePriority = (exerciseType?: ExerciseEnum): number => {
      if (exerciseType === ExerciseEnum.SNATCH) {
        return 0;
      }

      if (exerciseType === ExerciseEnum.CLEAN_AND_JERK) {
        return 1;
      }

      return 2;
    };

    const normalizedRecords = records.map(record => ({
      ...record,
      isLatest: false,
    }));

    const sortedRecords = [...normalizedRecords].sort((a, b) => {
      const priorityA = exercisePriority(a.exerciseType);
      const priorityB = exercisePriority(b.exerciseType);
      const priorityDiff = priorityA - priorityB;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (priorityA < 2 && priorityB < 2) {
        const timestampDiff = toTimestamp(b) - toTimestamp(a);
        if (timestampDiff !== 0) {
          return timestampDiff;
        }

        return a.recordName.localeCompare(b.recordName, undefined, {
          sensitivity: 'base',
        });
      }

      const nameDiff = a.recordName.localeCompare(b.recordName, undefined, {
        sensitivity: 'base',
      });
      if (nameDiff !== 0) {
        return nameDiff;
      }

      return toTimestamp(b) - toTimestamp(a);
    });

    const latestByExercise = new Map<ExerciseEnum | undefined, {
      timestamp: number;
      record: PersonalRecord;
    }>();

    sortedRecords.forEach(record => {
      const timestamp = toTimestamp(record);
      if (timestamp === Number.NEGATIVE_INFINITY) {
        return;
      }

      const existing = latestByExercise.get(record.exerciseType);
      if (!existing || timestamp > existing.timestamp) {
        latestByExercise.set(record.exerciseType, { timestamp, record });
      }
    });

    latestByExercise.forEach(({ record }) => {
      record.isLatest = true;
    });

    return sortedRecords;
  }

  getDesiredWeightForPercentage(pr: PersonalRecord, percentage: number): number {
    return this.sharedService.getDesiredWeightForPercentage(pr, percentage, this.selectedBarbell?.unit ?? WeightUnitEnum.KG);
  }

  /**
   * Returns the selected record key currently stored in the marks view state.
   */
  get selectedRecordKey(): string | null {
    return this.sharedService.getMarksViewStateSnapshot().selectedRecordKey;
  }

  /**
   * Returns the selected percentage currently stored in the marks view state.
   */
  get selectedPercentage(): number | null {
    return this.sharedService.getMarksViewStateSnapshot().selectedPercentage;
  }

  /**
   * Returns the selected calculator metadata currently stored in the marks view state.
   */
  get selectedCalculator() {
    return this.sharedService.getMarksViewStateSnapshot().selectedCalculator;
  }

  /**
   * Returns whether the provided personal record is currently selected.
   */
  isSelectedPR(pr: PersonalRecord): boolean {
    return this.selectedRecordKey === this.getPersonalRecordKey(pr);
  }

  /**
   * Restores marks tab selection from the consolidated in-memory view state after records are loaded.
   */
  private restoreMarksViewState(): void {
    const savedState = this.sharedService.getMarksViewStateSnapshot();
    const selectedRecordKey = savedState.selectedRecordKey;

    if (!selectedRecordKey) {
      this.selectedPR = null;
      return;
    }

    const selectedRecord = this.personalRecords.find(record => this.getPersonalRecordKey(record) === selectedRecordKey);
    if (!selectedRecord) {
      this.selectedPR = null;
      this.sharedService.patchMarksViewState({
        selectedRecordKey: null,
        selectedPercentage: null,
        selectedCalculator: null,
      });
      return;
    }

    this.selectedPR = selectedRecord;

    if (
      savedState.selectedCalculator &&
      savedState.selectedPercentage === savedState.selectedCalculator.percentage &&
      selectedRecord.exerciseType === savedState.selectedCalculator.exercise
    ) {
      return;
    }

    this.sharedService.patchMarksViewState({
      selectedCalculator: null,
    });
  }

  /**
   * Builds a stable key to identify personal records across component remounts.
   */
  private getPersonalRecordKey(record: PersonalRecord): string {
    const dateValue = record.date instanceof Date
      ? record.date.toISOString()
      : (record.date ?? '');

    return [
      record.recordName,
      record.record.toString(),
      record.recordUnit,
      record.exerciseType ?? '',
      dateValue,
    ].join('|');
  }
}

import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SharedService } from '../../service/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocalStorageService } from '../../service/local-storage.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { NewPrComponent } from './new-pr/new-pr.component';
import { PersonalRecord } from './personal-record.interface';
import { DataSyncResource, DataSyncService } from '../../service/data-sync.service';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { BumperPlatesCalculatorComponent } from '../bumper-plates-calculator/bumper-plates-calculator.component';
import { WeightUnitEnum } from '../../shared/enums/weight-unit.enum';

@Component({
    selector: 'app-personal-records',
    imports: [CommonModule, BumperPlatesCalculatorComponent, NewPrComponent],
    templateUrl: './personal-records.component.html',
    styleUrl: './personal-records.component.scss'
})
export class PersonalRecordsComponent implements OnDestroy, OnInit {
  private sharedService = inject(SharedService);

  personalRecords: PersonalRecord[] = [];
  showNewPR: boolean = false;
  showAllRecords: boolean = false;
  showNewPRSubscription: Subscription;
  reloadPRSubscription: Subscription;
  preferencesSubscription: Subscription = new Subscription();
  feedbackMessage: string | null = null;
  feedbackVariant: 'success' | 'danger' | 'warning' | 'info' = 'info';
  private feedbackResetTimeoutId: number | null = null;

  selectedPR: PersonalRecord | null = null;
  selectedPercentage: number | null = null;

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
  ]

  selectedBarbell: { value: number; unit: WeightUnitEnum } | null = null;

  /** User's preferred weight unit for plates suggestions. */
  preferredPlatesUnit?: WeightUnitEnum;

  private preferencesSub: Subscription = new Subscription();

  selectedCalculator: {
    exercise: ExerciseEnum;
    percentage: number;
  } | null = null;

  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private lsService: LocalStorageService,
    private dataSyncService: DataSyncService,
  ) {
    this.showNewPRSubscription = this.sharedService.getShowNewPR().subscribe( s => {
      this.showNewPR = s;
    });

    this.reloadPRSubscription = this.sharedService.getReloadPR().subscribe( r => {
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
      this.clearFeedbackTimeout();
  }

  addNewPR() {
    this.showNewPR = true;
  }

  deletePR(pr: any) {
    const newPR = this.personalRecords.filter( (p: any) => p !== pr);
    this.lsService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(newPR));
    this.loadPersonalRecords();
  }

  loadPersonalRecords() {
    const storedValue = this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const parsedRecords: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    this.personalRecords = this.sortPersonalRecords(parsedRecords);
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

  sendToPercentageCalculator(ev: MouseEvent, p: any) {
    ev.preventDefault();
    this.sharedService.sendSelectedPREvent(p);
    this.selectPR(p);
  }

  selectPR(pr: PersonalRecord) {
    this.selectedPercentage = null;
    if (this.selectedPR === pr) {
      this.selectedPR = null;
      return;
    }
    this.selectedPR = pr;
  }

  async openCalculatorForPRAndPercentage(pr: PersonalRecord, percentage: number) {
    this.closeCalculator();
    
    if (this.selectedPercentage === percentage) {
      this.selectedPercentage = null;
      return;
    }

    await new Promise(resolve => setTimeout(resolve));

    this.selectedPercentage = percentage;
    this.selectedCalculator = {exercise: pr!.exerciseType!, percentage};
  }

  closeCalculator() {
    this.selectedCalculator = null;
  }

  /**
   * Triggers the download of the stored personal records as a JSON file.
   */
  exportPersonalRecords(): void {
    try {
      const payload = this.dataSyncService.export([DataSyncResource.PersonalRecords]);
      const blob = new Blob([payload], { type: 'application/json' });
      const downloadLink = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);

      downloadLink.href = objectUrl;
      downloadLink.download = this.buildExportFileName();
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);

      this.setFeedback('Las marcas personales se exportaron correctamente.', 'success');
    } catch (error) {
      this.setFeedback('Ocurrió un error al exportar las marcas personales.', 'danger', true);
      console.error(error);
    }
  }

  /**
   * Opens the hidden file input so the user can pick a JSON file to import.
   */
  triggerImport(): void {
    if (this.personalRecords.length > 0) {
      const confirmed = window.confirm(
        'Importar reemplazará las marcas personales actuales y no podrás recuperarlas. ¿Deseas continuar?'
      );

      if (!confirmed) {
        this.setFeedback('Importación cancelada. Tus marcas actuales se mantienen sin cambios.', 'info');
        return;
      }
    }

    this.importFileInput?.nativeElement.click();
  }

  /**
   * Handles the JSON file selected by the user and persists the imported data.
   */
  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';

      try {
        const result = this.dataSyncService.import(content, {
          resources: [DataSyncResource.PersonalRecords],
        });

        if (result.importedResources.includes(DataSyncResource.PersonalRecords)) {
          this.loadPersonalRecords();
          const warnings = result.warnings.length > 0 ? ` (${result.warnings.join(' ')})` : '';
          this.setFeedback('Las marcas personales se importaron correctamente.' + warnings, 'success');
        } else {
          const warningMessage = result.warnings.join(' ') || 'No se importaron marcas personales.';
          this.setFeedback(warningMessage, 'warning', true);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo importar el archivo.';
        this.setFeedback(message, 'danger', true);
      } finally {
        this.resetImportFileInput();
      }
    };

    reader.onerror = () => {
      this.setFeedback('No se pudo leer el archivo seleccionado.', 'danger', true);
      this.resetImportFileInput();
    };

    reader.readAsText(file);
  }

  /**
   * Clears the file input so the same file can be selected again if needed.
   */
  private resetImportFileInput(): void {
    if (this.importFileInput?.nativeElement) {
      this.importFileInput.nativeElement.value = '';
    }
  }


  /**
   * Creates a descriptive filename for the exported personal records.
   */
  private buildExportFileName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `bumper-plates-personal-records-${timestamp}.json`;
  }

  /**
   * Stores the feedback message shown to the user and schedules its dismissal.
   */
  private setFeedback(message: string, variant: 'success' | 'danger' | 'warning' | 'info', persist: boolean = false): void {
    this.feedbackMessage = message;
    this.feedbackVariant = variant;
    this.clearFeedbackTimeout();

    if (!persist) {
      this.feedbackResetTimeoutId = window.setTimeout(() => {
        this.feedbackMessage = null;
        this.feedbackResetTimeoutId = null;
      }, 4000);
    }
  }

  /**
   * Cancels any pending auto-dismissal for the feedback message.
   */
  private clearFeedbackTimeout(): void {
    if (this.feedbackResetTimeoutId !== null) {
      window.clearTimeout(this.feedbackResetTimeoutId);
      this.feedbackResetTimeoutId = null;
    }
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

}

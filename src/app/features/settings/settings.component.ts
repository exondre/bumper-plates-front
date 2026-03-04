
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../../service/shared.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { DataSyncResource, DataSyncService } from '../../service/data-sync.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { WeightUnitEnum } from '../../shared/enums/weight-unit.enum';
import { PersonalRecord } from '../personal-records/personal-record.interface';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, OnDestroy {
  /** Current application version. */
  readonly version: string = (packageJson as { version: string }).version;

  /** Available barbell options. */
  barbellList: { value: number; unit: WeightUnitEnum }[] = [
    { value: 20, unit: WeightUnitEnum.KG },
    { value: 15, unit: WeightUnitEnum.KG },
    { value: 45, unit: WeightUnitEnum.LBS },
    { value: 35, unit: WeightUnitEnum.LBS },
  ];

  /** Currently selected barbell preference. */
  selectedBarbell: { value: number; unit: WeightUnitEnum } | null = null;

  /** Available plate unit options. */
  platesUnitList: WeightUnitEnum[] = [
    WeightUnitEnum.KG,
    WeightUnitEnum.LBS,
  ];

  /** Currently selected plates unit preference. */
  selectedPlatesUnit: WeightUnitEnum | null = null;

  /** Available marks display options. */
  marksDisplayOptions: { label: string; value: boolean }[] = [
    { label: 'Las más recientes', value: false },
    { label: 'Todas', value: true },
  ];

  /** Whether to show all personal records or only the latest ones. */
  showAllRecords: boolean = false;

  /** Available color scheme options. */
  colorSchemeOptions: { label: string; value: 'auto' | 'light' | 'dark' }[] = [
    { label: 'Sistema', value: 'auto' },
    { label: 'Claro',   value: 'light' },
    { label: 'Oscuro',  value: 'dark' },
  ];

  /** Currently selected color scheme. */
  selectedColorScheme: 'auto' | 'light' | 'dark' = 'auto';

  feedbackMessage: string | null = null;
  feedbackVariant: 'success' | 'danger' | 'warning' | 'info' = 'info';
  private feedbackResetTimeoutId: number | null = null;

  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  private preferencesSub: Subscription = new Subscription();

  constructor(
    private sharedService: SharedService,
    private lsService: LocalStorageService,
    private dataSyncService: DataSyncService,
  ) {}

  ngOnInit(): void {
    this.preferencesSub = this.sharedService.getPreferences().subscribe(preferences => {
      this.selectedBarbell = preferences.preferredBarbell
        ?? this.barbellList[0];
      this.selectedPlatesUnit = preferences.preferredPlatesUnits
        ?? WeightUnitEnum.KG;
      this.showAllRecords = Boolean(preferences.showAllPersonalRecords);
      this.selectedColorScheme = preferences.colorScheme ?? 'auto';
    });
  }

  /**
   * Updates the preferred barbell and persists the change.
   */
  selectBarbell(barbell: { value: number; unit: WeightUnitEnum }): void {
    this.selectedBarbell = barbell;
    this.sharedService.updatePreferences({ preferredBarbell: barbell });
  }

  /**
   * Updates the preferred plates unit and persists the change.
   */
  selectPlatesUnit(unit: WeightUnitEnum): void {
    this.selectedPlatesUnit = unit;
    this.sharedService.updatePreferences({ preferredPlatesUnits: unit });
  }

  /**
   * Updates the marks display preference and persists the change.
   */
  selectMarksDisplay(showAll: boolean): void {
    this.showAllRecords = showAll;
    this.sharedService.updatePreferences({ showAllPersonalRecords: showAll });
  }

  selectColorScheme(scheme: 'auto' | 'light' | 'dark'): void {
    this.selectedColorScheme = scheme;
    this.sharedService.updatePreferences({ colorScheme: scheme });
  }

  exportPersonalRecords(): void {
    try {
      const payload = this.dataSyncService.export([DataSyncResource.PersonalRecords]);
      const blob = new Blob([payload], { type: 'application/json' });
      const downloadLink = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);

      downloadLink.href = objectUrl;
      downloadLink.download = `bumper-plates-personal-records-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);

      this.setFeedback('Las marcas personales se exportaron correctamente.', 'success');
    } catch (error) {
      this.setFeedback('Ocurrió un error al exportar las marcas personales.', 'danger', true);
      console.error(error);
    }
  }

  triggerImport(): void {
    const storedValue = this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const records: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    if (records.length > 0) {
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
          const warnings = result.warnings.length > 0 ? ` (${result.warnings.join(' ')})` : '';
          this.setFeedback('Las marcas personales se importaron correctamente.' + warnings, 'success');
          this.sharedService.sendReloadPR();
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

  private resetImportFileInput(): void {
    if (this.importFileInput?.nativeElement) {
      this.importFileInput.nativeElement.value = '';
    }
  }

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

  private clearFeedbackTimeout(): void {
    if (this.feedbackResetTimeoutId !== null) {
      window.clearTimeout(this.feedbackResetTimeoutId);
      this.feedbackResetTimeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.preferencesSub.unsubscribe();
    this.clearFeedbackTimeout();
  }
}

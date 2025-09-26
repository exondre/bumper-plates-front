import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SharedService } from '../../service/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocalStorageService } from '../../service/local-storage.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { NewPrComponent } from './new-pr/new-pr.component';
import { PersonalRecord } from './personal-record.interface';
import { DataSyncResource, DataSyncService } from '../../service/data-sync.service';

@Component({
    selector: 'app-personal-records',
    imports: [CommonModule, NewPrComponent],
    templateUrl: './personal-records.component.html',
    styleUrl: './personal-records.component.scss'
})
export class PersonalRecordsComponent implements OnDestroy, OnInit {
  personalRecords: PersonalRecord[] = [];
  showNewPR: boolean = false;
  showNewPRSubscription: Subscription;
  reloadPRSubscription: Subscription;
  feedbackMessage: string | null = null;
  feedbackVariant: 'success' | 'danger' | 'warning' | 'info' = 'info';
  private feedbackResetTimeoutId: number | null = null;

  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private sharedService: SharedService,
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
    this.loadPersonalRecords();
  }

  ngOnDestroy(): void {
      this.showNewPRSubscription.unsubscribe();
      this.reloadPRSubscription.unsubscribe();
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
    this.personalRecords = JSON.parse(this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS)) ?? [];
  }

  sendToPercentageCalculator(ev: MouseEvent, p: any) {
    ev.preventDefault();
    this.sharedService.sendSelectedPREvent(p);
    // console.log(`${weight} ${unit}.`);
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
}

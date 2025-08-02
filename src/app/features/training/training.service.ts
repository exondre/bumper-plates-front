import { Injectable } from '@angular/core';
import { TrainingWeek } from './training.interface';
import { TrainingCsvParserService } from './training-csv-parser.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  constructor(
    private csvParser: TrainingCsvParserService,
    private localStorageService: LocalStorageService
  ) {}

  getTrainingData(): TrainingWeek[] {
    return JSON.parse(this.localStorageService.getItem(LSKeysEnum.BP_TRAINING_WEEKS) || '[]');
  }

  setTrainingData(trainingWeeks: TrainingWeek[]): void {
    this.localStorageService.setItem(
      LSKeysEnum.BP_TRAINING_WEEKS,
      JSON.stringify(trainingWeeks)
    );
  }

  loadDataFromCsv(csvText: string, weekName?: string): TrainingWeek[] {
    const trainingWeek = this.csvParser.parseCsv(csvText);
    const storedTrainingWeeks = this.getTrainingData();
    storedTrainingWeeks.push(trainingWeek);
    this.setTrainingData(storedTrainingWeeks);
    return storedTrainingWeeks;
  }

  getTrainingDataOnAppLoad(): { data: TrainingWeek[], error: boolean } {
    const rawDataFromLocalStorage = this.localStorageService.getItem(LSKeysEnum.BP_TRAINING_WEEKS);
    const dataFromLocalStorage = JSON.parse(rawDataFromLocalStorage) ?? [];
    const dataMissingId = dataFromLocalStorage.some((d: { id: any; }) => !d.id);
    if (dataFromLocalStorage && !dataMissingId) {
      return { data: dataFromLocalStorage, error: false };
    } else {
      return { data: [], error: true };
    }
  }

  purgeCorruptedData(): void {
    const dataFromLocalStorage = this.localStorageService.getItem(LSKeysEnum.BP_TRAINING_WEEKS);
    if (dataFromLocalStorage) {
      const parsedData = JSON.parse(dataFromLocalStorage);
      const validData = parsedData.filter((d: { id: any; }) => d.id);
      this.setTrainingData(validData);
    }
  }
}

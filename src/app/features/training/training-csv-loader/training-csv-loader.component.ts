import { Component, output } from '@angular/core';
import { TrainingWeek } from '../training.interface';
import { TrainingCsvParserService } from '../training-csv-parser.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { TrainingService } from '../training.service';

@Component({
  selector: 'app-training-csv-loader',
  imports: [CommonModule, FormsModule],
  templateUrl: './training-csv-loader.component.html',
  styleUrl: './training-csv-loader.component.scss'
})
export class TrainingCsvLoaderComponent {
  trainingWeeks = output<TrainingWeek[]>();
  csvLoadingDone = output<void>();

  csvText = '';
  trainingWeek: TrainingWeek | null = null;

  constructor(private trainingService: TrainingService) {}

  parse() {
    const storedTrainingWeeks = this.trainingService.loadDataFromCsv(this.csvText);
    this.trainingWeeks.emit(storedTrainingWeeks);
    this.csvLoadingDone.emit();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.csvText = reader.result as string;
        this.parse();
      };
      reader.readAsText(file);
    }
  }
}

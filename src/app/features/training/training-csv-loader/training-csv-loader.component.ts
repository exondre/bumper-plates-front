import { Component, output } from '@angular/core';
import { TrainingWeek } from '../training.interface';
import { TrainingCsvParserService } from '../training-csv-parser.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';

@Component({
  selector: 'app-training-csv-loader',
  imports: [CommonModule, FormsModule],
  templateUrl: './training-csv-loader.component.html',
  styleUrl: './training-csv-loader.component.scss'
})
export class TrainingCsvLoaderComponent {
  trainingWeeks = output<TrainingWeek[]>();

  csvText = '';
  trainingWeek: TrainingWeek | null = null;

  constructor(private csvParser: TrainingCsvParserService) {}

  parse() {
    this.trainingWeek = this.csvParser.parseCsv(this.csvText);
    const storedTrainingWeeks = JSON.parse(localStorage.getItem(LSKeysEnum.BP_TRAINING_WEEKS) || '[]');
    storedTrainingWeeks.push(this.trainingWeek);
    localStorage.setItem(LSKeysEnum.BP_TRAINING_WEEKS, JSON.stringify(storedTrainingWeeks));
    this.trainingWeeks.emit(storedTrainingWeeks);
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

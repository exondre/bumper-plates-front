import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrainingWeek } from '../training.interface';
import { TrainingService } from '../training.service';

@Component({
  selector: 'app-training-csv-loader',
  imports: [CommonModule, FormsModule],
  templateUrl: './training-csv-loader.component.html',
  styleUrl: './training-csv-loader.component.scss',
})
export class TrainingCsvLoaderComponent {
  trainingWeeks = output<TrainingWeek[]>();
  csvLoadingDone = output<void>();

  csvText = '';
  trainingWeek: TrainingWeek | null = null;

  constructor(private trainingService: TrainingService) {}

  parse() {
    let csv = this.csvText.trim();

    // Heuristic: Is it base64?
    // - Only base64 characters: A-Za-z0-9+/=
    // - Sufficiently long (avoids false positives with short strings)
    // - Few or no line breaks
    const isProbablyBase64 =
      /^[A-Za-z0-9+/=\r\n]+$/.test(csv) &&
      csv.length > 32 &&
      (csv.match(/\n/g)?.length ?? 0) < 3;

    if (isProbablyBase64) {
      try {
        // Try to decode. If it fails, continue as plain text.
        csv = this.base64ToString(csv).trim();
      } catch (e) {
        // Not valid base64, continue as plain text
      }
    }
    const storedTrainingWeeks = this.trainingService.loadDataFromCsv(csv);
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

  cancel() {
    this.csvLoadingDone.emit();
  }

  private base64ToString(base64: string): string {
    // Decodes a base64 string to UTF-8 (handles emojis and non-ASCII)
    const binary = globalThis.atob(base64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'exerciseLabel',
  standalone: true,
})
export class ExerciseLabelPipe implements PipeTransform {
  transform(value: string): string {
    const labels: Record<string, string> = {
      SNATCH: 'Arranque',
      CLEAN_AND_JERK: 'Envión',
      FRONT_SQUAT: 'Sentadilla frontal',
      BACK_SQUAT: 'Sentadilla trasera',
      NONE: 'Sin tipo',
    };
    return labels[value] ?? value;
  }
}
// This pipe transforms exercise type strings into user-friendly labels.

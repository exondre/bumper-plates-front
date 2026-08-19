import { Pipe, PipeTransform } from '@angular/core';
import { getExerciseLabel } from '../constants/exercise-catalog';
import { ExerciseEnum } from '../enums/ExerciseEnum';

@Pipe({
  name: 'exerciseLabel',
  standalone: true,
})
export class ExerciseLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return getExerciseLabel(value ?? ExerciseEnum.NONE);
  }
}

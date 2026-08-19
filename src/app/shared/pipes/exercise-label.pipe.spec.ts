import { ExerciseEnum } from '../enums/ExerciseEnum';
import { EXERCISE_CATALOG } from '../constants/exercise-catalog';
import { ExerciseLabelPipe } from './exercise-label.pipe';

describe('ExerciseLabelPipe', () => {
  const pipe = new ExerciseLabelPipe();

  it('returns the catalog label for every exercise type', () => {
    EXERCISE_CATALOG.forEach(exercise => {
      expect(pipe.transform(exercise.id)).toBe(exercise.label);
    });
  });

  it('uses Sin tipo for a missing type and preserves a future unknown value', () => {
    expect(pipe.transform(undefined)).toBe('Sin tipo');
    expect(pipe.transform(null)).toBe('Sin tipo');
    expect(pipe.transform(ExerciseEnum.NONE)).toBe('Sin tipo');
    expect(pipe.transform('FUTURE_TYPE')).toBe('FUTURE_TYPE');
  });
});

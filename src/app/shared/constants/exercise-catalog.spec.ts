import { ExerciseEnum } from '../enums/ExerciseEnum';
import {
  EXERCISE_CATALOG,
  EXERCISE_GROUPS,
  getExerciseLabel,
  getExerciseRecordOrder,
  isExerciseType,
} from './exercise-catalog';

describe('exercise catalog', () => {
  it('contains every supported exercise exactly once in selector order', () => {
    expect(EXERCISE_CATALOG.map(exercise => exercise.id)).toEqual([
      ExerciseEnum.SNATCH,
      ExerciseEnum.POWER_SNATCH,
      ExerciseEnum.HANG_SNATCH,
      ExerciseEnum.HANG_POWER_SNATCH,
      ExerciseEnum.CLEAN_AND_JERK,
      ExerciseEnum.CLEAN,
      ExerciseEnum.POWER_CLEAN,
      ExerciseEnum.HANG_SQUAT_CLEAN,
      ExerciseEnum.HANG_POWER_CLEAN,
      ExerciseEnum.SPLIT_JERK,
      ExerciseEnum.STRICT_PRESS,
      ExerciseEnum.PUSH_PRESS,
      ExerciseEnum.PUSH_JERK,
      ExerciseEnum.FRONT_SQUAT,
      ExerciseEnum.BACK_SQUAT,
      ExerciseEnum.OVERHEAD_SQUAT,
      ExerciseEnum.DEADLIFT,
      ExerciseEnum.THRUSTER,
      ExerciseEnum.BENCH_PRESS,
      ExerciseEnum.NONE,
    ]);
    expect(new Set(EXERCISE_CATALOG.map(exercise => exercise.id)).size).toBe(20);
    expect(EXERCISE_CATALOG.length).toBe(Object.values(ExerciseEnum).length);
  });

  it('uses localized selector groups and keeps the fallback last', () => {
    expect(EXERCISE_GROUPS.map(group => group.label)).toEqual([
      'Variantes de arranque',
      'Variantes de clean y envión',
      'Empujes',
      'Sentadillas',
      'Fuerza general con barra',
      'Otros',
    ]);
    expect(EXERCISE_CATALOG.at(-1)).toEqual(jasmine.objectContaining({
      id: ExerciseEnum.NONE,
      label: 'Sin tipo',
    }));
    expect(EXERCISE_GROUPS[1].exercises[0].id).toBe(ExerciseEnum.CLEAN_AND_JERK);
    expect(EXERCISE_GROUPS[4].exercises.at(-1)?.id).toBe(ExerciseEnum.BENCH_PRESS);
  });

  it('resolves labels and validates only canonical persisted tokens', () => {
    expect(getExerciseLabel(ExerciseEnum.CLEAN_AND_JERK)).toBe('Envión');
    expect(getExerciseLabel(ExerciseEnum.HANG_SQUAT_CLEAN)).toBe('Hang squat clean');
    expect(getExerciseLabel(ExerciseEnum.BENCH_PRESS)).toBe('Press de banca');
    expect(getExerciseLabel('FUTURE_TYPE')).toBe('FUTURE_TYPE');
    expect(isExerciseType(ExerciseEnum.HANG_POWER_SNATCH)).toBeTrue();
    expect(isExerciseType('hang_power_snatch')).toBeFalse();
    expect(isExerciseType(undefined)).toBeFalse();
  });

  it('preserves Arranque and Envión as the first record-list priorities', () => {
    expect(getExerciseRecordOrder(ExerciseEnum.SNATCH)).toBe(0);
    expect(getExerciseRecordOrder(ExerciseEnum.CLEAN_AND_JERK)).toBe(1);
    expect(getExerciseRecordOrder(ExerciseEnum.POWER_SNATCH)).toBe(2);
    expect(getExerciseRecordOrder('FUTURE_TYPE')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

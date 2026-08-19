import { ExerciseEnum } from '../enums/ExerciseEnum';

/** Describes one exercise option and its record-list ordering. */
export interface ExerciseDefinition {
  readonly id: ExerciseEnum;
  readonly label: string;
  readonly recordOrder: number;
}

/** Groups related exercise options under a localized selector label. */
export interface ExerciseGroup {
  readonly label: string;
  readonly exercises: readonly ExerciseDefinition[];
}

/** Localized exercise groups in selector display order. */
export const EXERCISE_GROUPS: readonly ExerciseGroup[] = [
  {
    label: 'Variantes de arranque',
    exercises: [
      { id: ExerciseEnum.SNATCH, label: 'Arranque', recordOrder: 0 },
      { id: ExerciseEnum.POWER_SNATCH, label: 'Power snatch', recordOrder: 2 },
      { id: ExerciseEnum.HANG_SNATCH, label: 'Hang snatch', recordOrder: 3 },
      { id: ExerciseEnum.HANG_POWER_SNATCH, label: 'Hang power snatch', recordOrder: 4 },
    ],
  },
  {
    label: 'Variantes de clean y envión',
    exercises: [
      { id: ExerciseEnum.CLEAN_AND_JERK, label: 'Envión', recordOrder: 1 },
      { id: ExerciseEnum.CLEAN, label: 'Clean', recordOrder: 5 },
      { id: ExerciseEnum.POWER_CLEAN, label: 'Power clean', recordOrder: 6 },
      { id: ExerciseEnum.HANG_SQUAT_CLEAN, label: 'Hang squat clean', recordOrder: 7 },
      { id: ExerciseEnum.HANG_POWER_CLEAN, label: 'Hang power clean', recordOrder: 8 },
      { id: ExerciseEnum.SPLIT_JERK, label: 'Split jerk', recordOrder: 9 },
    ],
  },
  {
    label: 'Empujes',
    exercises: [
      { id: ExerciseEnum.STRICT_PRESS, label: 'Press estricto', recordOrder: 10 },
      { id: ExerciseEnum.PUSH_PRESS, label: 'Push press', recordOrder: 11 },
      { id: ExerciseEnum.PUSH_JERK, label: 'Push jerk', recordOrder: 12 },
    ],
  },
  {
    label: 'Sentadillas',
    exercises: [
      { id: ExerciseEnum.FRONT_SQUAT, label: 'Sentadilla frontal', recordOrder: 13 },
      { id: ExerciseEnum.BACK_SQUAT, label: 'Sentadilla trasera', recordOrder: 14 },
      { id: ExerciseEnum.OVERHEAD_SQUAT, label: 'Sentadilla sobre la cabeza', recordOrder: 15 },
    ],
  },
  {
    label: 'Fuerza general con barra',
    exercises: [
      { id: ExerciseEnum.DEADLIFT, label: 'Peso muerto', recordOrder: 16 },
      { id: ExerciseEnum.THRUSTER, label: 'Thruster', recordOrder: 17 },
      { id: ExerciseEnum.BENCH_PRESS, label: 'Press de banca', recordOrder: 18 },
    ],
  },
  {
    label: 'Otros',
    exercises: [
      { id: ExerciseEnum.NONE, label: 'Sin tipo', recordOrder: 19 },
    ],
  },
];

/** Flat exercise definitions derived from the grouped catalog. */
export const EXERCISE_CATALOG: readonly ExerciseDefinition[] = EXERCISE_GROUPS
  .flatMap(group => group.exercises);

const EXERCISES_BY_ID = new Map<ExerciseEnum, ExerciseDefinition>(
  EXERCISE_CATALOG.map(exercise => [exercise.id, exercise]),
);

/** Returns whether a value is a canonical persisted exercise type. */
export function isExerciseType(value: unknown): value is ExerciseEnum {
  return typeof value === 'string' && EXERCISES_BY_ID.has(value as ExerciseEnum);
}

/** Returns the localized label for a canonical exercise type or the original value as a fallback. */
export function getExerciseLabel(value: string): string {
  return EXERCISES_BY_ID.get(value as ExerciseEnum)?.label ?? value;
}

/** Returns the record-list order for a known exercise and places unknown values last. */
export function getExerciseRecordOrder(value: unknown): number {
  return EXERCISES_BY_ID.get(value as ExerciseEnum)?.recordOrder
    ?? Number.MAX_SAFE_INTEGER;
}

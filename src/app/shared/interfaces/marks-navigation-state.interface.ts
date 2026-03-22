import { ExerciseEnum } from '../enums/ExerciseEnum';

/**
 * Snapshot payload used to identify a personal record across route navigation.
 */
export interface PersonalRecordNavigationSnapshot {
  recordName: string;
  record: number;
  recordUnit: string;
  exerciseType?: ExerciseEnum;
  date?: Date | string;
}

/**
 * Transient navigation state exchanged between the Home and Marcas routes.
 */
export interface MarksNavigationState {
  source: 'home-best-records';
  preselectedRecord: PersonalRecordNavigationSnapshot;
}

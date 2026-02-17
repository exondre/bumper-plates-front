import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';

/** Represents a user-defined record for a specific exercise or lift. */
export interface PersonalRecord {
  recordName: string;
  record: number;
  recordUnit: string;
  /** Exercise type associated with the record when available. */
  exerciseType?: ExerciseEnum;
  /** ISO timestamp string or Date instance indicating when the record was logged. */
  date?: Date | string;
  /** Indicates if this record is the latest for the associated exercise. */
  isLatest?: boolean;
}

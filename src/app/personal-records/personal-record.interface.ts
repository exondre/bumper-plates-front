import { ExerciseEnum } from '../shared/enums/ExerciseEnum';

export interface PersonalRecord {
  recordName: string;
  record: number;
  recordUnit: string;
  exerciseType?: ExerciseEnum; // Optional field for exercise type
  date?: Date; // Optional field for the date of the record
}

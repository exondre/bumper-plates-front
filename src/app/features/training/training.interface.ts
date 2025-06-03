import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';

export interface TrainingWeek {
  name: string;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  sessionNumber: string | number;
  exercises: TrainingExercise[];
}

export interface TrainingExercise {
  name: string;
  exerciseType?: ExerciseEnum;
  repLibres?: string;
  sets: TrainingSet[];
}

export interface TrainingSet {
  weightPercent?: number; // p.ej. 50, 60, etc.
  reps?: string; // p.ej. '2/2', '3', '4', '6x4'
}

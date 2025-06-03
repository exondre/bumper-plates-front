import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';

export interface TrainingWeek {
  id: string;
  name: string;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  id: string;
  sessionNumber: string | number;
  exercises: TrainingExercise[];
}

export interface TrainingExercise {
  id: string;
  name: string;
  exerciseType?: ExerciseEnum;
  repLibres?: string;
  sets: TrainingSet[];
}

export interface TrainingSet {
  id: string;
  weightPercent?: number; // p.ej. 50, 60, etc.
  reps?: string; // p.ej. '2/2', '3', '4', '6x4'
}

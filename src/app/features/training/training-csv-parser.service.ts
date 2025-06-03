// src/app/features/training/training-csv-parser.service.ts
import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import {
  TrainingWeek,
  TrainingSession,
  TrainingExercise,
  TrainingSet,
} from './training.interface';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';

@Injectable({ providedIn: 'root' })
export class TrainingCsvParserService {
  parseCsv(csvText: string, weekName?: string): TrainingWeek {
    if (!weekName) {
      weekName = `Semana ${this.getCurrentIsoWeekString()}`;
    }

    const result = Papa.parse(csvText, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
    });

    const percentColumns = Object.keys(result.data[0] || {}).filter((k) =>
      /^\d+$/.test(k)
    );

    const sessionMap: Record<string, TrainingSession> = {};

    for (const row of result.data as any[]) {
      if (!row.sesión) continue;
      const sessionNumbers = row.sesión
        .split(/,|-/)
        .map((s: string) => s.trim());
      const name = row.ejercicio;
      const exerciseType = row.exercise_type as ExerciseEnum;
      const repLibres = row.rep_libres;

      const sets: TrainingSet[] = percentColumns
        .map((percent) => {
          const val = row[percent];
          return val ? { weightPercent: Number(percent), reps: val } : null;
        })
        .filter(Boolean) as TrainingSet[];

      for (const sessionNum of sessionNumbers) {
        if (!sessionMap[sessionNum]) {
          sessionMap[sessionNum] = {
            sessionNumber: sessionNum,
            exercises: [],
          };
        }
        sessionMap[sessionNum].exercises.push({
          name,
          exerciseType: exerciseType || undefined,
          repLibres: repLibres || undefined,
          sets,
        });
      }
    }

    return {
      name: weekName,
      sessions: Object.values(sessionMap),
    };
  }

  private getCurrentIsoWeekString(): string {
    const date = new Date();
    // Ajusta al jueves de la semana actual según norma ISO
    const target = new Date(date.valueOf());
    target.setDate(target.getDate() + 3 - ((date.getDay() + 6) % 7));
    // Semana 1 contiene el primer jueves del año
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.valueOf() - firstThursday.valueOf();
    const weekNumber = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    // Mes y año
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-#${weekNumber}`;
  }
}

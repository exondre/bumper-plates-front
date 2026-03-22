import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { TrainingCsvParserService } from './training-csv-parser.service';

describe('TrainingCsvParserService', () => {
  let service: TrainingCsvParserService;

  beforeEach(() => {
    service = new TrainingCsvParserService();
  });

  it('parses csv rows into sessions and exercises with explicit week name', () => {
    let idCounter = 0;
    spyOn<any>(service, 'shortId').and.callFake(() => `id-${++idCounter}`);

    const result = service.parseCsv(
      [
        'sesión;ejercicio;exercise_type;rep_libres;70;80',
        '1, 2;Snatch;SNATCH;;2;3',
        '3-4;Back Squat;;AMRAP;;5',
        ';Ignored;SNATCH;;1;1',
      ].join('\n'),
      'Semana de prueba',
    );

    expect(result.name).toBe('Semana de prueba');
    expect(result.id).toBe('id-9');
    expect(result.sessions.map((session) => session.sessionNumber)).toEqual(['1', '2', '3', '4']);

    expect(result.sessions[0].exercises[0]).toEqual(jasmine.objectContaining({
      id: 'id-2',
      name: 'Snatch',
      exerciseType: ExerciseEnum.SNATCH,
      repLibres: undefined,
    }));
    expect(result.sessions[0].exercises[0].sets).toEqual([
      jasmine.objectContaining({ weightPercent: 70, reps: '2' }),
      jasmine.objectContaining({ weightPercent: 80, reps: '3' }),
    ]);

    expect(result.sessions[2].exercises[0]).toEqual(jasmine.objectContaining({
      id: 'id-6',
      name: 'Back Squat',
      exerciseType: undefined,
      repLibres: 'AMRAP',
    }));
    expect(result.sessions[2].exercises[0].sets).toEqual([
      jasmine.objectContaining({ weightPercent: 80, reps: '5' }),
    ]);
  });

  it('uses the current iso week when no name is provided', () => {
    spyOn<any>(service, 'getCurrentIsoWeekString').and.returnValue('2026-03-#12');
    let idCounter = 0;
    spyOn<any>(service, 'shortId').and.callFake(() => `generated-${++idCounter}`);

    const result = service.parseCsv(
      [
        'sesión;ejercicio;exercise_type;70',
        '1;Clean & Jerk;CLEAN_AND_JERK;2',
      ].join('\n'),
    );

    expect(result.name).toBe('Semana 2026-03-#12');
    expect(result.sessions[0].exercises[0].exerciseType).toBe(ExerciseEnum.CLEAN_AND_JERK);
  });

  it('returns an empty week when the parsed csv has no valid sessions', () => {
    let idCounter = 0;
    spyOn<any>(service, 'shortId').and.callFake(() => `empty-${++idCounter}`);

    const result = service.parseCsv(
      [
        'sesión;ejercicio;exercise_type;70',
        ';Snatch;SNATCH;2',
      ].join('\n'),
      'Semana vacía',
    );

    expect(result).toEqual({
      id: 'empty-1',
      name: 'Semana vacía',
      sessions: [],
    });
  });

  it('builds the iso week string and short ids deterministically for their helper logic', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-01-04T12:00:00.000Z'));
    spyOn(Math, 'random').and.returnValue(0.123456789);

    expect((service as any).getCurrentIsoWeekString()).toBe('2024-01-#1');
    expect((service as any).shortId(5)).toBe(Math.random().toString(36).slice(2, 7));

    jasmine.clock().uninstall();
  });
});

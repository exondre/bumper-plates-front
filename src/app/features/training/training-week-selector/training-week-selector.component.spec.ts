import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { WeightUnitEnum } from '../../../shared/enums/weight-unit.enum';
import { LocalStorageService } from '../../../service/local-storage.service';
import { SharedService } from '../../../service/shared.service';
import { Preferences } from '../../../shared/interfaces/preferences.interface';
import { PersonalRecord } from '../../personal-records/personal-record.interface';
import { TrainingExercise, TrainingSession, TrainingSet, TrainingWeek } from '../training.interface';
import { TrainingService } from '../training.service';
import { TrainingWeekSelectorComponent } from './training-week-selector.component';

describe('TrainingWeekSelectorComponent', () => {
  let component: TrainingWeekSelectorComponent;
  let fixture: ComponentFixture<TrainingWeekSelectorComponent>;
  let selectedWeek$: BehaviorSubject<TrainingWeek | null>;
  let selectedSession$: BehaviorSubject<TrainingSession | null>;
  let preferences$: BehaviorSubject<Preferences>;
  let sharedService: any;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let trainingService: jasmine.SpyObj<TrainingService>;

  const trainingSet: TrainingSet = {
    id: 'set-1',
    weightPercent: 80,
    reps: '3',
  };

  const trainingExercise: TrainingExercise = {
    id: 'exercise-1',
    name: 'Arranque',
    exerciseType: ExerciseEnum.SNATCH,
    sets: [trainingSet],
  };

  const trainingSession: TrainingSession = {
    id: 'session-1',
    sessionNumber: 1,
    exercises: [trainingExercise],
  };

  const trainingWeek: TrainingWeek = {
    id: 'week-1',
    name: 'Semana 1',
    sessions: [trainingSession],
  };

  const personalRecords: PersonalRecord[] = [
    {
      recordName: 'Snatch antiguo',
      record: 75,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: '2024-01-01T00:00:00.000Z',
    },
    {
      recordName: 'Snatch reciente',
      record: 80,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: '2024-02-01T00:00:00.000Z',
    },
    {
      recordName: 'Envión empate',
      record: 100,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.CLEAN_AND_JERK,
      date: '2024-03-01T00:00:00.000Z',
    },
    {
      recordName: 'Envión empate 2',
      record: 102,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.CLEAN_AND_JERK,
      date: '2024-03-01T00:00:00.000Z',
    },
    {
      recordName: 'Front squat',
      record: 120,
      recordUnit: 'lbs',
      exerciseType: ExerciseEnum.FRONT_SQUAT,
      date: 'invalid-date',
    },
  ];

  const createComponent = () => {
    fixture = TestBed.createComponent(TrainingWeekSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    selectedWeek$ = new BehaviorSubject<TrainingWeek | null>(null);
    selectedSession$ = new BehaviorSubject<TrainingSession | null>(null);
    preferences$ = new BehaviorSubject<Preferences>({});

    sharedService = {
      getSelectedWeek: jasmine.createSpy('getSelectedWeek').and.returnValue(selectedWeek$.asObservable()),
      getSelectedSession: jasmine.createSpy('getSelectedSession').and.returnValue(selectedSession$.asObservable()),
      getPreferences: jasmine.createSpy('getPreferences').and.returnValue(preferences$.asObservable()),
      setSelectedWeek: jasmine.createSpy('setSelectedWeek').and.callFake((week: TrainingWeek | null) => {
        selectedWeek$.next(week);
      }),
      setSelectedSession: jasmine.createSpy('setSelectedSession').and.callFake((session: TrainingSession | null) => {
        selectedSession$.next(session);
      }),
      updatePreferences: jasmine.createSpy('updatePreferences').and.callFake((patch: Partial<Preferences>) => {
        preferences$.next({
          ...preferences$.value,
          ...patch,
        });
      }),
      poundToKiloFactor: 0.453592,
      kiloToPoundFactor: 2.20462,
    };

    localStorageService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem']);
    localStorageService.getItem.and.returnValue(JSON.stringify(personalRecords));

    trainingService = jasmine.createSpyObj<TrainingService>('TrainingService', [
      'getTrainingDataOnAppLoad',
      'purgeCorruptedData',
      'getTrainingData',
    ]);
    trainingService.getTrainingDataOnAppLoad.and.returnValue({
      data: [trainingWeek],
      error: false,
    });

    await TestBed.configureTestingModule({
      imports: [TrainingWeekSelectorComponent],
      providers: [
        { provide: SharedService, useValue: sharedService },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TrainingService, useValue: trainingService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('should create, load training data and react to preference updates', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(component.storedWeeks).toEqual([trainingWeek]);
    expect(component.personalRecords.length).toBe(5);
    expect(component.selectedBarbell).toEqual({ value: 20, unit: WeightUnitEnum.KG });

    preferences$.next({
      preferredBarbell: { value: 45, unit: WeightUnitEnum.LBS },
      preferredPlatesUnits: WeightUnitEnum.LBS,
    });

    expect(component.selectedBarbell).toEqual({ value: 45, unit: WeightUnitEnum.LBS });
    expect(component.preferredPlatesUnit).toBe(WeightUnitEnum.LBS);
  });

  it('handles corrupted training data recovery confirmation', () => {
    trainingService.getTrainingDataOnAppLoad.and.returnValue({ data: [], error: true });
    trainingService.getTrainingData.and.returnValue([trainingWeek]);
    const confirmSpy = spyOn(window, 'confirm');

    confirmSpy.and.returnValue(true);
    createComponent();

    expect(trainingService.purgeCorruptedData).toHaveBeenCalled();
    expect(component.storedWeeks).toEqual([trainingWeek]);

    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('keeps empty weeks when corrupted data recovery is declined', async () => {
    trainingService.getTrainingDataOnAppLoad.and.returnValue({ data: [], error: true });
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [TrainingWeekSelectorComponent],
      providers: [
        { provide: SharedService, useValue: sharedService },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TrainingService, useValue: trainingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingWeekSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalled();
    expect(trainingService.purgeCorruptedData).not.toHaveBeenCalled();
    expect(component.storedWeeks).toEqual([]);
  });

  it('selects and deselects weeks and sessions through the shared state', () => {
    createComponent();

    component.selectWeek(trainingWeek);
    expect(component.selectedWeek).toBe(trainingWeek);
    expect(sharedService.setSelectedWeek).toHaveBeenCalledWith(trainingWeek);
    expect(sharedService.setSelectedSession).toHaveBeenCalledWith(null);

    component.selectWeek(trainingWeek);
    expect(component.selectedWeek).toBeUndefined();
    expect(component.selectedSession).toBeUndefined();

    component.selectSession(trainingSession);
    expect(component.selectedSession).toBe(trainingSession);
    expect(sharedService.setSelectedSession).toHaveBeenCalledWith(trainingSession);

    component.selectSession(trainingSession);
    expect(component.selectedSession).toBeUndefined();
  });

  it('deletes weeks only after confirmation and persists the updated list', () => {
    createComponent();
    component.storedWeeks = [trainingWeek];
    component.selectedWeek = trainingWeek;
    component.selectedSession = trainingSession;
    const confirmSpy = spyOn(window, 'confirm');
    const setItemSpy = spyOn(localStorage, 'setItem');

    confirmSpy.and.returnValue(false);
    component.deleteWeek(trainingWeek);
    expect(setItemSpy).not.toHaveBeenCalled();

    confirmSpy.and.returnValue(true);
    component.deleteWeek(trainingWeek);
    expect(component.storedWeeks).toEqual([]);
    expect(component.selectedWeek).toBeUndefined();
    expect(component.selectedSession).toBeUndefined();
    expect(setItemSpy).toHaveBeenCalledWith(LSKeysEnum.BP_TRAINING_WEEKS, '[]');
  });

  it('shows the loader, stores updated weeks and remembers the selected barbell', () => {
    createComponent();
    const closeSpy = spyOn(component, 'closeCalculator').and.callThrough();

    component.addWeek();
    expect(component.showWeekLoader).toBeTrue();

    component.listenToLoadingDone([trainingWeek]);
    expect(component.storedWeeks).toEqual([trainingWeek]);
    expect(component.showWeekLoader).toBeFalse();

    component.selectBarbell({ value: 35, unit: WeightUnitEnum.LBS });
    expect(component.selectedBarbell).toEqual({ value: 35, unit: WeightUnitEnum.LBS });
    expect(sharedService.updatePreferences).toHaveBeenCalledWith({
      preferredBarbell: { value: 35, unit: WeightUnitEnum.LBS },
    });
    expect(closeSpy).toHaveBeenCalled();
  });

  it('resolves fallback barbells and returns the latest personal record for a type', () => {
    createComponent();
    component.initialWeight = 22;
    component.initialWeightUnit = WeightUnitEnum.LBS;

    expect((component as any).getDefaultBarbell()).toEqual({ value: 20, unit: WeightUnitEnum.KG });
    expect(component.getPersonalRecordForType(ExerciseEnum.BACK_SQUAT)).toBeUndefined();
    expect(component.getPersonalRecordForType(ExerciseEnum.SNATCH)?.recordName).toBe('Snatch reciente');
    expect(component.getPersonalRecordForType(ExerciseEnum.CLEAN_AND_JERK)?.recordName).toBe('Envión empate 2');

    component.personalRecords = [
      { recordName: 'Back squat reciente', record: 150, recordUnit: 'kg', exerciseType: ExerciseEnum.BACK_SQUAT, date: '2024-02-01T00:00:00.000Z' },
      { recordName: 'Back squat sin fecha', record: 140, recordUnit: 'kg', exerciseType: ExerciseEnum.BACK_SQUAT },
      { recordName: 'Back squat antiguo', record: 130, recordUnit: 'kg', exerciseType: ExerciseEnum.BACK_SQUAT, date: '2024-01-01T00:00:00.000Z' },
    ];
    expect(component.getPersonalRecordForType(ExerciseEnum.BACK_SQUAT)?.recordName).toBe('Back squat reciente');
  });

  it('opens the calculator asynchronously, closes it and converts desired weights', fakeAsync(() => {
    createComponent();
    component.selectedCalculator = {
      exercise: trainingExercise,
      set: trainingSet,
    };
    const closeSpy = spyOn(component, 'closeCalculator').and.callThrough();

    component.openCalculatorForSet(trainingExercise, trainingSet);
    expect(closeSpy).toHaveBeenCalled();
    expect(component.selectedCalculator).toBeNull();

    tick();
    expect(component.selectedCalculator).toEqual({
      exercise: trainingExercise,
      set: trainingSet,
    });

    component.closeCalculator();
    expect(component.selectedCalculator).toBeNull();

    expect(component.getDesiredWeightForSet(personalRecords[1], trainingSet, WeightUnitEnum.KG)).toBe(64);
    expect(component.getDesiredWeightForSet({ ...personalRecords[4], record: 100, recordUnit: WeightUnitEnum.LBS }, trainingSet, WeightUnitEnum.KG)).toBeCloseTo(36.29, 2);
    expect(component.getDesiredWeightForSet(personalRecords[1], trainingSet, WeightUnitEnum.LBS)).toBeCloseTo(141.1, 1);
    expect(component.getDesiredWeightForSet(personalRecords[1], { id: 'set-2', reps: '5' }, WeightUnitEnum.KG)).toBe(80);
  }));

  it('syncs selected week and session from the shared service and unsubscribes on destroy', () => {
    createComponent();
    selectedWeek$.next(trainingWeek);
    selectedSession$.next(trainingSession);

    expect(component.selectedWeek).toBe(trainingWeek);
    expect(component.selectedSession).toBe(trainingSession);

    const weekUnsubscribeSpy = spyOn((component as any).weekSub, 'unsubscribe').and.callThrough();
    const sessionUnsubscribeSpy = spyOn((component as any).sessionSub, 'unsubscribe').and.callThrough();
    const preferencesUnsubscribeSpy = spyOn((component as any).preferencesSub, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(sharedService.setSelectedWeek).toHaveBeenCalledWith(trainingWeek);
    expect(sharedService.setSelectedSession).toHaveBeenCalledWith(trainingSession);
    expect(weekUnsubscribeSpy).toHaveBeenCalled();
    expect(sessionUnsubscribeSpy).toHaveBeenCalled();
    expect(preferencesUnsubscribeSpy).toHaveBeenCalled();
  });
});

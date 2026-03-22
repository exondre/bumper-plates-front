import { Subscription } from 'rxjs';
import { ExerciseEnum } from '../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../shared/enums/LSKeysEnum';
import { WeightUnitEnum } from '../shared/enums/weight-unit.enum';
import { PersonalRecord } from '../features/personal-records/personal-record.interface';
import { TrainingSession, TrainingWeek } from '../features/training/training.interface';
import { LocalStorageService } from './local-storage.service';
import { SharedService } from './shared.service';

describe('SharedService', () => {
  let service: SharedService;
  let lsService: jasmine.SpyObj<LocalStorageService>;
  let subscriptions: Subscription;

  const personalRecord: PersonalRecord = {
    recordName: 'Arranque',
    record: 100,
    recordUnit: WeightUnitEnum.KG,
    exerciseType: ExerciseEnum.SNATCH,
  };

  beforeEach(() => {
    lsService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem', 'setItem']);
    lsService.getItem.and.returnValue(null);
    subscriptions = new Subscription();
    service = new SharedService(lsService);
  });

  afterEach(() => {
    subscriptions.unsubscribe();
  });

  it('loads persisted preferences on construction', () => {
    lsService.getItem.and.returnValue(JSON.stringify({
      showAllPersonalRecords: true,
      preferredPlatesUnits: WeightUnitEnum.LBS,
    }));

    service = new SharedService(lsService);

    let currentPreferences: any;
    subscriptions.add(service.getPreferences().subscribe((preferences) => {
      currentPreferences = preferences;
    }));

    expect(lsService.getItem).toHaveBeenCalledWith(LSKeysEnum.BP_PREFERENCES);
    expect(currentPreferences.showAllPersonalRecords).toBeTrue();
    expect(currentPreferences.preferredPlatesUnits).toBe(WeightUnitEnum.LBS);
  });

  it('logs invalid persisted preferences without throwing', () => {
    lsService.getItem.and.returnValue('{invalid json');
    const consoleErrorSpy = spyOn(console, 'error');

    expect(() => new SharedService(lsService)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('emits percentage, new pr, reload and selected pr events', () => {
    const percentageEvents: any[] = [];
    const showNewPREvents: boolean[] = [];
    const reloadEvents: boolean[] = [];
    const selectedPREvents: Array<PersonalRecord | null> = [];

    subscriptions.add(service.getSelectedPercentageEvent().subscribe((event) => {
      percentageEvents.push(event);
    }));
    subscriptions.add(service.getShowNewPR().subscribe((event) => {
      showNewPREvents.push(event);
    }));
    subscriptions.add(service.getReloadPR().subscribe((event) => {
      reloadEvents.push(event);
    }));
    subscriptions.add(service.getSelectedPREvent().subscribe((event) => {
      selectedPREvents.push(event);
    }));

    service.sendSelectedPercentageEvent({ percentageWeight: 90, unit: 'kg' });
    service.sendShowNewPR(true);
    service.sendReloadPR();
    service.sendSelectedPREvent(personalRecord);

    expect(percentageEvents).toEqual([null, { percentageWeight: 90, unit: 'kg' }]);
    expect(showNewPREvents).toEqual([true]);
    expect(reloadEvents).toEqual([true]);
    expect(selectedPREvents).toEqual([null, personalRecord]);
  });

  it('patches and resets the marks view state', () => {
    const states: any[] = [];
    subscriptions.add(service.getMarksViewState().subscribe((state) => {
      states.push(state);
    }));

    service.patchMarksViewState({
      selectedRecordKey: 'snatch|100|kg',
      selectedPercentage: 85,
      selectedCalculator: {
        exercise: ExerciseEnum.SNATCH,
        percentage: 85,
      },
      scrollTop: 120,
    });

    expect(service.getMarksViewStateSnapshot()).toEqual({
      selectedRecordKey: 'snatch|100|kg',
      selectedPercentage: 85,
      selectedCalculator: {
        exercise: ExerciseEnum.SNATCH,
        percentage: 85,
      },
      scrollTop: 120,
    });

    service.resetMarksViewState();

    expect(service.getMarksViewStateSnapshot()).toEqual({
      selectedRecordKey: null,
      selectedPercentage: null,
      selectedCalculator: null,
      scrollTop: 0,
    });
    expect(states.length).toBe(3);
  });

  it('emits selected week and session changes', () => {
    const week: TrainingWeek = {
      id: 'week-1',
      name: 'Semana 1',
      sessions: [],
    };
    const session: TrainingSession = {
      id: 'session-1',
      sessionNumber: 1,
      exercises: [],
    };
    const selectedWeeks: Array<TrainingWeek | null> = [];
    const selectedSessions: Array<TrainingSession | null> = [];

    subscriptions.add(service.getSelectedWeek().subscribe((value) => {
      selectedWeeks.push(value);
    }));
    subscriptions.add(service.getSelectedSession().subscribe((value) => {
      selectedSessions.push(value);
    }));

    service.setSelectedWeek(week);
    service.setSelectedSession(session);

    expect(selectedWeeks).toEqual([null, week]);
    expect(selectedSessions).toEqual([null, session]);
  });

  it('updates preferences, merges values and persists them', () => {
    service.updatePreferences({
      showAllPersonalRecords: true,
      preferredBarbell: { value: 15, unit: WeightUnitEnum.KG },
    });
    service.updatePreferences({
      preferredPlatesUnits: WeightUnitEnum.LBS,
    });

    let currentPreferences: any;
    subscriptions.add(service.getPreferences().subscribe((preferences) => {
      currentPreferences = preferences;
    }));

    expect(currentPreferences).toEqual({
      showAllPersonalRecords: true,
      preferredBarbell: { value: 15, unit: WeightUnitEnum.KG },
      preferredPlatesUnits: WeightUnitEnum.LBS,
    });
    expect(lsService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.BP_PREFERENCES,
      JSON.stringify(currentPreferences),
    );
  });

  it('calculates desired weights and converts units when needed', () => {
    expect(service.getDesiredWeightForPercentage(personalRecord, 80, WeightUnitEnum.KG)).toBe(80);
    expect(service.getDesiredWeightForPercentage(personalRecord, 80, WeightUnitEnum.LBS)).toBeCloseTo(176.37, 2);
    expect(service.getDesiredWeightForPercentage({ ...personalRecord, recordUnit: WeightUnitEnum.LBS }, 50, WeightUnitEnum.KG)).toBeCloseTo(22.68, 2);
    expect(service.getDesiredWeightForPercentage(personalRecord, 0, WeightUnitEnum.KG)).toBe(100);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { WeightUnitEnum } from '../../shared/enums/weight-unit.enum';
import { LocalStorageService } from '../../service/local-storage.service';
import { SharedService } from '../../service/shared.service';
import { Preferences } from '../../shared/interfaces/preferences.interface';
import { PersonalRecord } from './personal-record.interface';
import { PersonalRecordsComponent } from './personal-records.component';

describe('PersonalRecordsComponent', () => {
  let component: PersonalRecordsComponent;
  let fixture: ComponentFixture<PersonalRecordsComponent>;
  let showNewPR$: Subject<boolean>;
  let reloadPR$: Subject<boolean>;
  let preferences$: BehaviorSubject<Preferences>;
  let sharedService: any;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let router: jasmine.SpyObj<Router>;
  let marksViewState: any;

  const records: PersonalRecord[] = [
    {
      recordName: 'Front squat',
      record: 120,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.FRONT_SQUAT,
      date: 'invalid-date',
    },
    {
      recordName: 'Envión',
      record: 110,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.CLEAN_AND_JERK,
      date: '2024-03-01T00:00:00.000Z',
    },
    {
      recordName: 'Arranque viejo',
      record: 80,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: '2024-01-01T00:00:00.000Z',
    },
    {
      recordName: 'Arranque nuevo',
      record: 85,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: '2024-02-01T00:00:00.000Z',
    },
  ];

  const createComponent = () => {
    fixture = TestBed.createComponent(PersonalRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const setMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy().and.returnValue({
        matches,
      }),
    });
  };

  beforeEach(async () => {
    showNewPR$ = new Subject<boolean>();
    reloadPR$ = new Subject<boolean>();
    preferences$ = new BehaviorSubject<Preferences>({
      showAllPersonalRecords: false,
    });
    marksViewState = {
      selectedRecordKey: null,
      selectedPercentage: null,
      selectedCalculator: null,
      scrollTop: 0,
    };

    sharedService = {
      getShowNewPR: jasmine.createSpy('getShowNewPR').and.returnValue(showNewPR$.asObservable()),
      getReloadPR: jasmine.createSpy('getReloadPR').and.returnValue(reloadPR$.asObservable()),
      getPreferences: jasmine.createSpy('getPreferences').and.returnValue(preferences$.asObservable()),
      sendSelectedPREvent: jasmine.createSpy('sendSelectedPREvent'),
      updatePreferences: jasmine.createSpy('updatePreferences').and.callFake((patch: Partial<Preferences>) => {
        preferences$.next({
          ...preferences$.value,
          ...patch,
        });
      }),
      getDesiredWeightForPercentage: jasmine.createSpy('getDesiredWeightForPercentage').and.returnValue(72),
      getMarksViewStateSnapshot: jasmine.createSpy('getMarksViewStateSnapshot').and.callFake(() => marksViewState),
      patchMarksViewState: jasmine.createSpy('patchMarksViewState').and.callFake((patch: any) => {
        marksViewState = {
          ...marksViewState,
          ...patch,
        };
      }),
      getSelectedPercentageEvent: jasmine.createSpy('getSelectedPercentageEvent').and.returnValue(new Subject().asObservable()),
      poundToKiloFactor: 0.453592,
      kiloToPoundFactor: 2.20462,
    };

    localStorageService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem', 'setItem']);
    localStorageService.getItem.and.returnValue(JSON.stringify(records));

    router = jasmine.createSpyObj<Router>('Router', ['getCurrentNavigation']);
    router.getCurrentNavigation.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [PersonalRecordsComponent],
      providers: [
        { provide: SharedService, useValue: sharedService },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('should create, sort records by priority and apply default preferences', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(component.personalRecords.map((record) => record.recordName)).toEqual([
      'Arranque nuevo',
      'Arranque viejo',
      'Envión',
      'Front squat',
    ]);
    expect(component.personalRecords[0].isLatest).toBeTrue();
    expect(component.personalRecords[1].isLatest).toBeFalse();
    expect(component.personalRecords[2].isLatest).toBeTrue();
    expect(component.personalRecords[3].isLatest).toBeFalse();
    expect(component.showAllRecords).toBeFalse();
    expect(component.selectedBarbell).toEqual({ value: 20, unit: WeightUnitEnum.KG });
  });

  it('reacts to show new pr and reload events', () => {
    createComponent();
    const loadSpy = spyOn(component, 'loadPersonalRecords').and.callThrough();
    component.editingRecord = records[0];

    showNewPR$.next(true);
    expect(component.showNewPR).toBeTrue();

    showNewPR$.next(false);
    expect(component.showNewPR).toBeFalse();
    expect(component.editingRecord).toBeNull();

    reloadPR$.next(true);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('adds, edits, deletes records and updates the show-all preference', () => {
    createComponent();
    const loadSpy = spyOn(component, 'loadPersonalRecords').and.stub();
    const confirmSpy = spyOn(window, 'confirm');
    const recordToDelete = component.personalRecords[0];

    component.addNewPR();
    expect(component.showNewPR).toBeTrue();
    expect(component.editingRecord).toBeNull();

    component.editPR(records[1]);
    expect(component.showNewPR).toBeTrue();
    expect(component.editingRecord).toBe(records[1]);

    confirmSpy.and.returnValue(false);
    component.deletePR(recordToDelete);
    expect(localStorageService.setItem).not.toHaveBeenCalled();

    confirmSpy.and.returnValue(true);
    component.deletePR(recordToDelete);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.PERSONAL_RECORDS,
      JSON.stringify(component.personalRecords.filter((record) => record !== recordToDelete)),
    );
    expect(loadSpy).toHaveBeenCalled();

    component.onShowAllRecordsToggle({
      target: { checked: true },
    } as unknown as Event);
    expect(sharedService.updatePreferences).toHaveBeenCalledWith({
      showAllPersonalRecords: true,
    });
  });

  it('sends the selected record to the percentage calculator and toggles selection state', () => {
    createComponent();
    const record = component.personalRecords[0];
    const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault']);

    component.sendToPercentageCalculator(event, record);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(sharedService.sendSelectedPREvent).toHaveBeenCalledWith(record);
    expect(component.selectedPR).toBe(record);
    expect(component.selectedRecordKey).toContain('Arranque nuevo');
    expect(component.isSelectedPR(record)).toBeTrue();

    component.selectPR(record);

    expect(component.selectedPR).toBeNull();
    expect(component.selectedRecordKey).toBeNull();
  });

  it('opens and closes the calculator for a selected record and percentage', () => {
    createComponent();
    const record = component.personalRecords[0];
    const scrollSpy = spyOn<any>(component, 'scrollCalculatorPanelIfNeeded').and.stub();

    component.openCalculatorForPRAndPercentage(record, 85);

    expect(component.selectedPR).toBe(record);
    expect(component.selectedPercentage).toBe(85);
    expect(component.selectedCalculator).toEqual({
      exercise: ExerciseEnum.SNATCH,
      percentage: 85,
    });
    expect(scrollSpy).toHaveBeenCalled();

    component.openCalculatorForPRAndPercentage(record, 85);
    expect(component.selectedPercentage).toBeNull();
    expect(component.selectedCalculator).toBeNull();

    component.closeCalculator();
    expect(sharedService.patchMarksViewState).toHaveBeenCalledWith({
      selectedCalculator: null,
    });
  });

  it('scrolls calculator and selected record panels only when they are outside the comfortable viewport zone', () => {
    createComponent();
    setMatchMedia(false);
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    const element = {
      getBoundingClientRect: () => ({ top: 0, height: 100 } as DOMRect),
      scrollIntoView,
    };
    spyOn(document, 'querySelector').and.returnValue(element as never);

    (component as any).scrollCalculatorPanelIfNeeded();
    (component as any).shouldScrollToSelectedRecord = true;
    (component as any).scrollSelectedRecordIfNeeded();

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect((component as any).isElementWithinComfortableViewportZone({ top: 250, height: 100 } as DOMRect)).toBeTrue();
    expect((component as any).isElementWithinComfortableViewportZone({ top: 0, height: 50 } as DOMRect)).toBeFalse();
  });

  it('applies navigation preselection from router state and restores the selected record', () => {
    setMatchMedia(true);
    spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    router.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          source: 'home-best-records',
          preselectedRecord: {
            recordName: 'Arranque nuevo',
            record: 85,
            recordUnit: 'kg',
            exerciseType: ExerciseEnum.SNATCH,
            date: '2024-02-01T00:00:00.000Z',
          },
        },
      },
    } as never);

    createComponent();

    expect(component.selectedPR?.recordName).toBe('Arranque nuevo');
    expect(component.selectedRecordKey).toContain('Arranque nuevo');
  });

  it('clears marks view state when the stored selection cannot be restored', () => {
    marksViewState = {
      selectedRecordKey: 'missing-record',
      selectedPercentage: 90,
      selectedCalculator: {
        exercise: ExerciseEnum.SNATCH,
        percentage: 90,
      },
      scrollTop: 0,
    };

    createComponent();

    expect(component.selectedPR).toBeNull();
    expect(component.selectedRecordKey).toBeNull();
    expect(component.selectedCalculator).toBeNull();
  });

  it('keeps a compatible calculator selection and clears incompatible calculator state', () => {
    createComponent();
    const record = component.personalRecords[0];
    const key = (component as any).getPersonalRecordKey(record);

    marksViewState = {
      selectedRecordKey: key,
      selectedPercentage: 80,
      selectedCalculator: {
        exercise: ExerciseEnum.SNATCH,
        percentage: 80,
      },
      scrollTop: 0,
    };
    (component as any).restoreMarksViewState();
    expect(component.selectedPR).toBe(record);
    expect(component.selectedCalculator).toEqual({
      exercise: ExerciseEnum.SNATCH,
      percentage: 80,
    });

    marksViewState = {
      selectedRecordKey: key,
      selectedPercentage: 75,
      selectedCalculator: {
        exercise: ExerciseEnum.CLEAN_AND_JERK,
        percentage: 80,
      },
      scrollTop: 0,
    };
    (component as any).restoreMarksViewState();
    expect(component.selectedCalculator).toBeNull();
    expect(component.selectedPercentage).toBeNull();
  });

  it('opens calculator when percentage matches but there is no active calculator selection', () => {
    createComponent();
    const record = component.personalRecords[0];
    const key = (component as any).getPersonalRecordKey(record);
    const scrollSpy = spyOn<any>(component, 'scrollCalculatorPanelIfNeeded').and.stub();

    marksViewState = {
      selectedRecordKey: key,
      selectedPercentage: 85,
      selectedCalculator: null,
      scrollTop: 0,
    };

    component.openCalculatorForPRAndPercentage(record, 85);

    expect(component.selectedPercentage).toBe(85);
    expect(component.selectedCalculator).toEqual({
      exercise: ExerciseEnum.SNATCH,
      percentage: 85,
    });
    expect(scrollSpy).toHaveBeenCalled();
  });

  it('delegates desired weight calculation and validates navigation snapshots', () => {
    createComponent();
    component.selectedBarbell = { value: 15, unit: WeightUnitEnum.LBS };

    expect(component.getDesiredWeightForPercentage(records[0], 60)).toBe(72);
    expect(sharedService.getDesiredWeightForPercentage).toHaveBeenCalledWith(records[0], 60, WeightUnitEnum.LBS);

    expect((component as any).isPersonalRecordNavigationSnapshot(null)).toBeFalse();
    expect((component as any).isPersonalRecordNavigationSnapshot({ recordName: 'A' })).toBeFalse();
    expect((component as any).isPersonalRecordNavigationSnapshot({
      recordName: 'A',
      record: 1,
      recordUnit: 'kg',
      date: 123,
    })).toBeFalse();
    expect((component as any).isPersonalRecordNavigationSnapshot({
      recordName: 'A',
      record: 1,
      recordUnit: 'kg',
      exerciseType: 'INVALID',
    })).toBeFalse();
    expect((component as any).isPersonalRecordNavigationSnapshot({
      recordName: 'A',
      record: 1,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: new Date('2024-01-01T00:00:00.000Z'),
    })).toBeTrue();

    const navigationState = (component as any).getMarksNavigationStateFromCurrentNavigation();
    expect(navigationState).toBeNull();

    const generatedKey = (component as any).getPersonalRecordKey({
      recordName: 'Temporal',
      record: 90,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.SNATCH,
      date: new Date('2024-05-01T00:00:00.000Z'),
    });
    expect(generatedKey).toContain('2024-05-01T00:00:00.000Z');
  });

  it('unsubscribes from every subscription on destroy', () => {
    createComponent();
    const showSpy = spyOn(component.showNewPRSubscription, 'unsubscribe').and.callThrough();
    const reloadSpy = spyOn(component.reloadPRSubscription, 'unsubscribe').and.callThrough();
    const preferencesSpy = spyOn(component.preferencesSubscription, 'unsubscribe').and.callThrough();
    const preferencesSecondarySpy = spyOn((component as any).preferencesSub, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(showSpy).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
    expect(preferencesSpy).toHaveBeenCalled();
    expect(preferencesSecondarySpy).toHaveBeenCalled();
  });
});

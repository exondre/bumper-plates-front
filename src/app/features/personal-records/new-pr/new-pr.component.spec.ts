import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { LocalStorageService } from '../../../service/local-storage.service';
import { SharedService } from '../../../service/shared.service';
import { PersonalRecord } from '../personal-record.interface';
import { NewPrComponent } from './new-pr.component';

describe('NewPrComponent', () => {
  let component: NewPrComponent;
  let fixture: ComponentFixture<NewPrComponent>;
  let sharedService: jasmine.SpyObj<SharedService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;

  const editRecord: PersonalRecord = {
    recordName: 'Arranque',
    record: 95,
    recordUnit: 'kg',
    exerciseType: ExerciseEnum.SNATCH,
    date: '2024-06-15T00:00:00.000Z',
  };

  const createComponent = async (record: PersonalRecord | null = null) => {
    await TestBed.configureTestingModule({
      imports: [NewPrComponent],
      providers: [
        { provide: SharedService, useValue: sharedService },
        { provide: LocalStorageService, useValue: localStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPrComponent);
    component = fixture.componentInstance;
    component.editRecord = record;
    fixture.detectChanges();
  };

  beforeEach(() => {
    sharedService = jasmine.createSpyObj<SharedService>('SharedService', ['sendReloadPR', 'sendShowNewPR']);
    localStorageService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem', 'setItem']);
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    localStorageService.getItem.and.returnValue('[]');
    await createComponent();

    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
  });

  it('loads the existing record when editing', async () => {
    await createComponent(editRecord);

    expect(component.isEditMode).toBeTrue();
    expect(component.weightRecordName).toBe('Arranque');
    expect(component.weightRecord).toBe(95);
    expect(component.weightRecordUnit).toBe('kg');
    expect(component.recordExcerciseType).toBe(ExerciseEnum.SNATCH);
  });

  it('renders every catalog exercise in localized groups', async () => {
    await createComponent();

    const groupElements = Array.from(
      fixture.nativeElement.querySelectorAll('optgroup') as NodeListOf<HTMLOptGroupElement>,
    );
    const optionElements = Array.from(
      fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>,
    );

    expect(groupElements.map(group => group.label)).toEqual([
      'Variantes de arranque',
      'Variantes de clean y envión',
      'Empujes',
      'Sentadillas',
      'Fuerza general con barra',
      'Otros',
    ]);
    expect(optionElements.length).toBe(20);
    expect(optionElements.at(-1)?.value).toBe(ExerciseEnum.NONE);
    expect(optionElements.at(-1)?.textContent?.trim()).toBe('Sin tipo');
  });

  it('saves a new record, persists it and closes the form', async () => {
    localStorageService.getItem.and.returnValue('[]');
    await createComponent();

    component.weightRecordName = 'Hang power clean';
    component.weightRecord = 120;
    component.weightRecordUnit = 'lbs';
    component.recordExcerciseType = ExerciseEnum.HANG_POWER_CLEAN;

    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.PERSONAL_RECORDS,
      jasmine.any(String),
    );
    expect(savedPayload.length).toBe(1);
    expect(savedPayload[0].recordName).toBe('Hang power clean');
    expect(savedPayload[0].record).toBe(120);
    expect(savedPayload[0].recordUnit).toBe('lbs');
    expect(savedPayload[0].exerciseType).toBe(ExerciseEnum.HANG_POWER_CLEAN);
    expect(sharedService.sendReloadPR).toHaveBeenCalled();
    expect(sharedService.sendShowNewPR).toHaveBeenCalledWith(false);
    expect(component.weightRecordName).toBe('');
    expect(component.weightRecord).toBe(0);
    expect(component.weightRecordUnit).toBe('kg');
  });

  it('updates the matching record in edit mode', async () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([
      editRecord,
      {
        recordName: 'Sentadilla',
        record: 140,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.BACK_SQUAT,
      },
    ]));
    await createComponent(editRecord);

    component.weightRecordName = 'Arranque power';
    component.weightRecord = 100;
    component.weightRecordUnit = 'kg';
    component.recordExcerciseType = ExerciseEnum.SNATCH;

    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(savedPayload.length).toBe(2);
    expect(savedPayload[0].recordName).toBe('Arranque power');
    expect(savedPayload[0].record).toBe(100);
    expect(savedPayload[1].recordName).toBe('Sentadilla');
  });

  it('keeps a legacy NONE record unchanged until it is explicitly reclassified', async () => {
    const legacyRecord: PersonalRecord = {
      recordName: 'Thruster',
      record: 82.5,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.NONE,
      date: '2024-02-20T00:00:00.000Z',
    };
    localStorageService.getItem.and.returnValue(JSON.stringify([legacyRecord]));
    await createComponent(legacyRecord);

    expect(component.recordExcerciseType).toBe(ExerciseEnum.NONE);

    component.recordExcerciseType = ExerciseEnum.THRUSTER;
    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(savedPayload).toEqual([{
      ...legacyRecord,
      exerciseType: ExerciseEnum.THRUSTER,
    }]);
  });

  it('saves a legacy NONE record without adding a date or inferring a type', async () => {
    const legacyRecord: PersonalRecord = {
      recordName: 'Peso Muerto',
      record: 145,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.NONE,
    };
    localStorageService.getItem.and.returnValue(JSON.stringify([legacyRecord]));
    await createComponent(legacyRecord);

    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(savedPayload).toEqual([legacyRecord]);
  });

  it('updates the exact dated record when duplicate names, weights and units exist', async () => {
    const duplicateRecords: PersonalRecord[] = [
      {
        recordName: 'Thruster',
        record: 80,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.NONE,
        date: '2024-01-01T00:00:00.000Z',
      },
      {
        recordName: 'Thruster',
        record: 80,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.NONE,
        date: '2024-02-01T00:00:00.000Z',
      },
    ];
    localStorageService.getItem.and.returnValue(JSON.stringify(duplicateRecords));
    await createComponent(duplicateRecords[1]);

    component.recordExcerciseType = ExerciseEnum.THRUSTER;
    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(savedPayload[0].exerciseType).toBe(ExerciseEnum.NONE);
    expect(savedPayload[1].exerciseType).toBe(ExerciseEnum.THRUSTER);
    expect(savedPayload[1].date).toBe('2024-02-01T00:00:00.000Z');
  });

  it('cancels the form and restores defaults', async () => {
    await createComponent();
    component.weightRecordName = 'Temporal';
    component.weightRecord = 77;
    component.weightRecordUnit = 'lbs';

    component.cancelNewRecord();

    expect(component.weightRecordName).toBe('');
    expect(component.weightRecord).toBe(0);
    expect(component.weightRecordUnit).toBe('kg');
    expect(sharedService.sendShowNewPR).toHaveBeenCalledWith(false);
  });
});

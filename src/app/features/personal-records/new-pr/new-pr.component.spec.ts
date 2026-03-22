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

  it('saves a new record, persists it and closes the form', async () => {
    localStorageService.getItem.and.returnValue('[]');
    await createComponent();

    component.weightRecordName = 'Envión';
    component.weightRecord = 120;
    component.weightRecordUnit = 'lbs';
    component.recordExcerciseType = ExerciseEnum.CLEAN_AND_JERK;

    component.saveNewRecord();

    const savedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.PERSONAL_RECORDS,
      jasmine.any(String),
    );
    expect(savedPayload.length).toBe(1);
    expect(savedPayload[0].recordName).toBe('Envión');
    expect(savedPayload[0].record).toBe(120);
    expect(savedPayload[0].recordUnit).toBe('lbs');
    expect(savedPayload[0].exerciseType).toBe(ExerciseEnum.CLEAN_AND_JERK);
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LocalStorageService } from '../../service/local-storage.service';
import { SharedService } from '../../service/shared.service';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let reload$: Subject<boolean>;
  let router: Router;

  beforeEach(async () => {
    reload$ = new Subject<boolean>();
    localStorageService = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      ['getItem', 'setItem'],
    );

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: LocalStorageService, useValue: localStorageService },
        {
          provide: SharedService,
          useValue: {
            getReloadPR: jasmine.createSpy('getReloadPR').and.returnValue(reload$.asObservable()),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('loads the latest record per exact type without mutating storage', () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([
      {
        recordName: 'Thruster antiguo',
        record: 70,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.THRUSTER,
        date: '2024-01-01T00:00:00.000Z',
      },
      {
        recordName: 'Thruster reciente',
        record: 75,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.THRUSTER,
        date: '2024-02-01T00:00:00.000Z',
      },
      {
        recordName: 'Hang squat clean',
        record: 90,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.HANG_SQUAT_CLEAN,
        date: '2024-01-15T00:00:00.000Z',
      },
      {
        recordName: 'Peso muerto legado',
        record: 150,
        recordUnit: 'kg',
        date: '2024-03-01T00:00:00.000Z',
      },
    ]));

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.latestRecords.map(record => record.recordName)).toEqual([
      'Hang squat clean',
      'Thruster reciente',
      'Peso muerto legado',
    ]);
    expect(localStorageService.setItem).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Sin tipo');
  });

  it('navigates to Marks preserving a new exercise type', () => {
    localStorageService.getItem.and.returnValue('[]');
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.openRecordInMarks({
      recordName: 'Press de banca',
      record: 105,
      recordUnit: 'kg',
      exerciseType: ExerciseEnum.BENCH_PRESS,
      date: '2024-04-01T00:00:00.000Z',
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/marcas'], {
      state: {
        source: 'home-best-records',
        preselectedRecord: {
          recordName: 'Press de banca',
          record: 105,
          recordUnit: 'kg',
          exerciseType: ExerciseEnum.BENCH_PRESS,
          date: '2024-04-01T00:00:00.000Z',
        },
      },
    });
  });
});

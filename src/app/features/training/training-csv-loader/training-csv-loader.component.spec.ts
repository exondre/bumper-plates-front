import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainingWeek } from '../training.interface';
import { TrainingService } from '../training.service';
import { TrainingCsvLoaderComponent } from './training-csv-loader.component';

describe('TrainingCsvLoaderComponent', () => {
  let component: TrainingCsvLoaderComponent;
  let fixture: ComponentFixture<TrainingCsvLoaderComponent>;
  let trainingService: jasmine.SpyObj<TrainingService>;

  const storedWeeks: TrainingWeek[] = [{
    id: 'week-1',
    name: 'Semana 1',
    sessions: [],
  }];

  beforeEach(async () => {
    trainingService = jasmine.createSpyObj<TrainingService>('TrainingService', ['loadDataFromCsv']);
    trainingService.loadDataFromCsv.and.returnValue(storedWeeks);

    await TestBed.configureTestingModule({
      imports: [TrainingCsvLoaderComponent],
      providers: [
        { provide: TrainingService, useValue: trainingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingCsvLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('parses plain text csv and emits the updated weeks', () => {
    const weeksEmitSpy = spyOn(component.trainingWeeks, 'emit');
    const doneEmitSpy = spyOn(component.csvLoadingDone, 'emit');
    component.csvText = '  sesión;ejercicio;70\n1;Snatch;2  ';

    component.parse();

    expect(trainingService.loadDataFromCsv).toHaveBeenCalledWith('sesión;ejercicio;70\n1;Snatch;2');
    expect(weeksEmitSpy).toHaveBeenCalledWith(storedWeeks);
    expect(doneEmitSpy).toHaveBeenCalled();
  });

  it('decodes probable base64 input before loading the csv', () => {
    const plainCsv = 'session;exercise;exercise_type;70;80\n1;Snatch;SNATCH;2;3';
    component.csvText = btoa(plainCsv);

    component.parse();

    expect(trainingService.loadDataFromCsv).toHaveBeenCalledWith(plainCsv);
  });

  it('falls back to the original text when base64 decoding fails', () => {
    spyOn<any>(component, 'base64ToString').and.throwError('invalid base64');
    component.csvText = 'A'.repeat(40);

    component.parse();

    expect(trainingService.loadDataFromCsv).toHaveBeenCalledWith('A'.repeat(40));
  });

  it('reads the selected file and triggers parsing', () => {
    const parseSpy = spyOn(component, 'parse');
    const fileReaderMock = {
      result: '',
      onload: null as FileReader['onload'],
      readAsText: jasmine.createSpy('readAsText').and.callFake(() => {
        fileReaderMock.result = 'csv from file';
        fileReaderMock.onload?.call(fileReaderMock as unknown as FileReader, new ProgressEvent('load') as ProgressEvent<FileReader>);
      }),
    };

    spyOn(window as never, 'FileReader').and.returnValue(fileReaderMock as never);

    component.onFileChange({
      target: {
        files: [{}],
      },
    });

    expect(fileReaderMock.readAsText).toHaveBeenCalled();
    expect(component.csvText).toBe('csv from file');
    expect(parseSpy).toHaveBeenCalled();
  });

  it('ignores file changes when the input does not contain a file and can cancel loading', () => {
    const doneEmitSpy = spyOn(component.csvLoadingDone, 'emit');

    component.onFileChange({ target: { files: [] } });
    component.cancel();

    expect(trainingService.loadDataFromCsv).not.toHaveBeenCalled();
    expect(doneEmitSpy).toHaveBeenCalledTimes(1);
  });
});

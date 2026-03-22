import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { LocalStorageService } from '../../service/local-storage.service';
import { TrainingCsvParserService } from './training-csv-parser.service';
import { TrainingWeek } from './training.interface';
import { TrainingService } from './training.service';

describe('TrainingService', () => {
  let service: TrainingService;
  let csvParser: jasmine.SpyObj<TrainingCsvParserService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;

  const trainingWeek: TrainingWeek = {
    id: 'week-1',
    name: 'Semana 1',
    sessions: [],
  };

  beforeEach(() => {
    csvParser = jasmine.createSpyObj<TrainingCsvParserService>('TrainingCsvParserService', ['parseCsv']);
    localStorageService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem', 'setItem']);
    service = new TrainingService(csvParser, localStorageService);
  });

  it('reads training weeks from local storage and falls back to an empty list', () => {
    localStorageService.getItem.and.returnValues(
      JSON.stringify([trainingWeek]),
      null,
    );

    expect(service.getTrainingData()).toEqual([trainingWeek]);
    expect(service.getTrainingData()).toEqual([]);
    expect(localStorageService.getItem).toHaveBeenCalledWith(LSKeysEnum.BP_TRAINING_WEEKS);
  });

  it('persists training weeks in local storage', () => {
    service.setTrainingData([trainingWeek]);

    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.BP_TRAINING_WEEKS,
      JSON.stringify([trainingWeek]),
    );
  });

  it('loads a week from csv, appends it to stored data and persists the result', () => {
    const existingWeek: TrainingWeek = {
      id: 'week-0',
      name: 'Semana previa',
      sessions: [],
    };

    csvParser.parseCsv.and.returnValue(trainingWeek);
    localStorageService.getItem.and.returnValue(JSON.stringify([existingWeek]));

    const result = service.loadDataFromCsv('csv;content', 'Semana ignorada');

    expect(csvParser.parseCsv).toHaveBeenCalledWith('csv;content');
    expect(result).toEqual([existingWeek, trainingWeek]);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.BP_TRAINING_WEEKS,
      JSON.stringify([existingWeek, trainingWeek]),
    );
  });

  it('returns valid app load data when every week contains an id', () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([trainingWeek]));

    expect(service.getTrainingDataOnAppLoad()).toEqual({
      data: [trainingWeek],
      error: false,
    });
  });

  it('flags corrupted app load data when a week is missing its id', () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([{ name: 'Sin id', sessions: [] }]));

    expect(service.getTrainingDataOnAppLoad()).toEqual({
      data: [],
      error: true,
    });
  });

  it('treats missing app load data as an empty but valid dataset', () => {
    localStorageService.getItem.and.returnValue(null);

    expect(service.getTrainingDataOnAppLoad()).toEqual({
      data: [],
      error: false,
    });
  });

  it('purges corrupted records and leaves storage untouched when there is nothing to purge', () => {
    localStorageService.getItem.and.returnValues(
      JSON.stringify([
        trainingWeek,
        { name: 'Sin id', sessions: [] },
      ]),
      null,
    );

    service.purgeCorruptedData();
    service.purgeCorruptedData();

    expect(localStorageService.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.BP_TRAINING_WEEKS,
      JSON.stringify([trainingWeek]),
    );
  });
});

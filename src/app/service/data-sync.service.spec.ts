import { ExerciseEnum } from '../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../shared/enums/LSKeysEnum';
import { LocalStorageService } from './local-storage.service';
import { DataSyncPayload, DataSyncResource, DataSyncService } from './data-sync.service';

describe('DataSyncService', () => {
  let service: DataSyncService;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-03-01T12:00:00.000Z'));

    localStorageService = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem', 'setItem']);
    service = new DataSyncService(localStorageService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('exports the requested resources with metadata', () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([
      {
        recordName: 'Arranque',
        record: 80,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.SNATCH,
      },
    ]));

    const exportedPayload = JSON.parse(service.export([
      DataSyncResource.PersonalRecords,
      'unsupported' as DataSyncResource,
    ])) as DataSyncPayload;

    expect(exportedPayload.schemaVersion).toBe('1.0.0');
    expect(exportedPayload.exportedAt).toBe('2024-03-01T12:00:00.000Z');
    expect(exportedPayload.resources[DataSyncResource.PersonalRecords]).toEqual({
      version: 1,
      data: [{
        recordName: 'Arranque',
        record: 80,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.SNATCH,
      }],
    });
    expect((service as any).buildResourcePayload('unsupported')).toBeNull();
  });

  it('imports personal records replacing existing data by default', () => {
    const result = service.import(JSON.stringify({
      schemaVersion: '1.0.0',
      exportedAt: '2024-03-01T12:00:00.000Z',
      resources: {
        [DataSyncResource.PersonalRecords]: {
          version: 1,
          data: [
            {
              recordName: '  Envión  ',
              record: 100,
              recordUnit: ' lbs ',
              exerciseType: ExerciseEnum.CLEAN_AND_JERK,
              date: '2024-01-15T00:00:00.000Z',
            },
            null,
          ],
        },
      },
    }));

    const persistedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(result).toEqual({
      importedResources: [DataSyncResource.PersonalRecords],
      warnings: [],
      schemaVersion: '1.0.0',
    });
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      LSKeysEnum.PERSONAL_RECORDS,
      jasmine.any(String),
    );
    expect(persistedPayload[0].recordName).toBe('Envión');
    expect(persistedPayload[0].recordUnit).toBe('lbs');
    expect(persistedPayload[0].exerciseType).toBe(ExerciseEnum.CLEAN_AND_JERK);
    expect(persistedPayload[0].date).toBe('2024-01-15T00:00:00.000Z');
  });

  it('merges personal records by name when merge mode is enabled', () => {
    localStorageService.getItem.and.returnValue(JSON.stringify([
      {
        recordName: 'Arranque',
        record: 75,
        recordUnit: 'kg',
      },
      {
        recordName: 'Sentadilla',
        record: 140,
        recordUnit: 'kg',
      },
    ]));

    service.import(JSON.stringify({
      schemaVersion: '1.0.0',
      exportedAt: '2024-03-01T12:00:00.000Z',
      resources: {
        [DataSyncResource.PersonalRecords]: {
          version: 1,
          data: [
            {
              recordName: 'Arranque',
              record: 80,
              recordUnit: 'kg',
            },
            {
              recordName: 'Envión',
              record: 100,
              recordUnit: 'kg',
            },
          ],
        },
      },
    }), { merge: true });

    const mergedPayload = JSON.parse(localStorageService.setItem.calls.mostRecent().args[1]);
    expect(mergedPayload).toEqual([
      { recordName: 'Arranque', record: 80, recordUnit: 'kg' },
      { recordName: 'Sentadilla', record: 140, recordUnit: 'kg' },
      { recordName: 'Envión', record: 100, recordUnit: 'kg' },
    ]);
  });

  it('returns warnings for invalid or unsupported resources', () => {
    const result = service.import(JSON.stringify({
      schemaVersion: '1.0.0',
      exportedAt: '2024-03-01T12:00:00.000Z',
      resources: {
        unsupported: {
          version: 1,
          data: [],
        },
        [DataSyncResource.PersonalRecords]: {
          version: 99,
          data: [],
        },
      },
    }), {
      resources: ['unsupported' as DataSyncResource, DataSyncResource.PersonalRecords],
    });

    expect(result.importedResources).toEqual([]);
    expect(result.warnings).toEqual([
      'El recurso unsupported no está soportado en esta versión.',
      'La versión de las marcas personales no es compatible con esta aplicación.',
    ]);
  });

  it('validates parsed payloads and rejects malformed content', () => {
    expect(() => (service as any).parsePayload('{')).toThrowError('No se pudo leer el archivo seleccionado. Verifica que sea un JSON válido.');
    expect(() => (service as any).parsePayload('null')).toThrowError('El archivo seleccionado no contiene datos válidos.');
    expect(() => (service as any).parsePayload(JSON.stringify({ resources: {} }))).toThrowError('El archivo seleccionado no especifica la versión del esquema.');
    expect(() => (service as any).parsePayload(JSON.stringify({ schemaVersion: '1.0.0' }))).toThrowError('El archivo seleccionado no contiene recursos exportados.');
  });

  it('rejects invalid personal records payloads and sanitizes supported records', () => {
    expect(() => (service as any).persistPersonalRecords({ version: 1, data: {} })).toThrowError('Los datos de marcas personales deben ser un arreglo.');
    expect(() => (service as any).persistPersonalRecords({ version: 1, data: [null, { recordName: '', record: 1, recordUnit: 'kg' }] })).toThrowError('El archivo no contiene marcas personales válidas.');

    expect((service as any).sanitizePersonalRecords([
      null,
      {
        recordName: ' Power clean ',
        record: 90,
        recordUnit: ' kg ',
        exerciseType: ExerciseEnum.CLEAN_AND_JERK,
        date: 'invalid-date',
      },
    ])).toEqual([
      {
        recordName: 'Power clean',
        record: 90,
        recordUnit: 'kg',
        exerciseType: ExerciseEnum.CLEAN_AND_JERK,
      },
    ]);

    expect((service as any).coercePersonalRecord({
      recordName: ' ',
      record: 90,
      recordUnit: 'kg',
    })).toBeNull();
    expect((service as any).coercePersonalRecord({
      recordName: 'Arranque',
      record: Number.NaN,
      recordUnit: 'kg',
    })).toBeNull();
    expect((service as any).coercePersonalRecord({
      recordName: 'Arranque',
      record: 90,
      recordUnit: '',
    })).toBeNull();
  });
});

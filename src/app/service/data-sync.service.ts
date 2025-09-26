import { Injectable } from '@angular/core';
import { PersonalRecord } from '../features/personal-records/personal-record.interface';
import { LSKeysEnum } from '../shared/enums/LSKeysEnum';
import { LocalStorageService } from './local-storage.service';

/**
 * Identifies the supported data resources that can be synchronized.
 */
export enum DataSyncResource {
  PersonalRecords = 'personalRecords',
}

/**
 * Structure for the data persisted by each resource.
 */
export interface DataSyncResourcePayload<T = unknown> {
  version: number;
  data: T;
}

/**
 * Envelope describing a synced dataset with metadata.
 */
export interface DataSyncPayload {
  schemaVersion: string;
  exportedAt: string;
  resources: Partial<Record<DataSyncResource, DataSyncResourcePayload>>;
}

/**
 * Options for customizing the import process.
 */
export interface DataSyncImportOptions {
  resources?: DataSyncResource[];
  merge?: boolean;
}

/**
 * Result of an import operation, including imported resources and warnings.
 */
export interface DataSyncImportResult {
  importedResources: DataSyncResource[];
  warnings: string[];
  schemaVersion: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataSyncService {
  private static readonly PERSONAL_RECORDS_VERSION = 1;
  private static readonly SCHEMA_VERSION = '1.0.0';

  constructor(private readonly localStorageService: LocalStorageService) {}

  /**
   * Builds a serialized JSON payload for the provided resources.
   */
  export(resources: DataSyncResource[] = [DataSyncResource.PersonalRecords]): string {
    const payload: DataSyncPayload = {
      schemaVersion: DataSyncService.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      resources: {},
    };

    resources.forEach((resource) => {
      const resourcePayload = this.buildResourcePayload(resource);
      if (resourcePayload) {
        payload.resources[resource] = resourcePayload;
      }
    });

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Imports data from a serialized payload and persists supported resources.
   */
  import(serializedPayload: string, options?: DataSyncImportOptions): DataSyncImportResult {
    const warnings: string[] = [];
    const parsedPayload = this.parsePayload(serializedPayload);

    const resourcesToImport = options?.resources ?? (Object.keys(parsedPayload.resources) as DataSyncResource[]);
    const importedResources: DataSyncResource[] = [];

    resourcesToImport.forEach((resource) => {
      const resourcePayload = parsedPayload.resources[resource];
      if (!resourcePayload) {
        return;
      }

      try {
        this.persistResource(resource, resourcePayload, options);
        importedResources.push(resource);
      } catch (error) {
        warnings.push((error as Error).message);
      }
    });

    return {
      importedResources,
      warnings,
      schemaVersion: parsedPayload.schemaVersion,
    };
  }

  private buildResourcePayload(resource: DataSyncResource): DataSyncResourcePayload | null {
    switch (resource) {
      case DataSyncResource.PersonalRecords:
        return this.buildPersonalRecordsPayload();
      default:
        return null;
    }
  }

  private buildPersonalRecordsPayload(): DataSyncResourcePayload<PersonalRecord[]> {
    const storedValue = this.localStorageService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const data: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    return {
      version: DataSyncService.PERSONAL_RECORDS_VERSION,
      data,
    };
  }

  private parsePayload(serializedPayload: string): DataSyncPayload {
    let parsedPayload: DataSyncPayload;

    try {
      parsedPayload = JSON.parse(serializedPayload) as DataSyncPayload;
    } catch (error) {
      throw new Error('No se pudo leer el archivo seleccionado. Verifica que sea un JSON válido.');
    }

    if (!parsedPayload || typeof parsedPayload !== 'object') {
      throw new Error('El archivo seleccionado no contiene datos válidos.');
    }

    if (!parsedPayload.schemaVersion) {
      throw new Error('El archivo seleccionado no especifica la versión del esquema.');
    }

    if (!parsedPayload.resources) {
      throw new Error('El archivo seleccionado no contiene recursos exportados.');
    }

    return parsedPayload;
  }

  private persistResource(
    resource: DataSyncResource,
    payload: DataSyncResourcePayload,
    options?: DataSyncImportOptions,
  ): void {
    switch (resource) {
      case DataSyncResource.PersonalRecords:
        this.persistPersonalRecords(payload as DataSyncResourcePayload<unknown>, options);
        break;
      default:
        throw new Error(`El recurso ${resource} no está soportado en esta versión.`);
    }
  }

  private persistPersonalRecords(
    payload: DataSyncResourcePayload<unknown>,
    options?: DataSyncImportOptions,
  ): void {
    if (payload.version !== DataSyncService.PERSONAL_RECORDS_VERSION) {
      throw new Error('La versión de las marcas personales no es compatible con esta aplicación.');
    }

    if (!Array.isArray(payload.data)) {
      throw new Error('Los datos de marcas personales deben ser un arreglo.');
    }

    const sanitizedRecords = this.sanitizePersonalRecords(payload.data);
    if (sanitizedRecords.length === 0) {
      throw new Error('El archivo no contiene marcas personales válidas.');
    }

    if (options?.merge) {
      this.mergePersonalRecords(sanitizedRecords);
    } else {
      this.localStorageService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(sanitizedRecords));
    }
  }

  private sanitizePersonalRecords(records: unknown[]): PersonalRecord[] {
    return records.reduce<PersonalRecord[]>((acc, record) => {
      if (!record || typeof record !== 'object') {
        return acc;
      }

      const parsedRecord = this.coercePersonalRecord(record as Record<string, unknown>);
      if (!parsedRecord) {
        return acc;
      }

      return [...acc, parsedRecord];
    }, []);
  }

  private coercePersonalRecord(record: Record<string, unknown>): PersonalRecord | null {
    const { recordName, record: recordValue, recordUnit, exerciseType, date } = record;

    if (typeof recordName !== 'string' || !recordName.trim()) {
      return null;
    }

    if (typeof recordValue !== 'number' || Number.isNaN(recordValue)) {
      return null;
    }

    if (typeof recordUnit !== 'string' || !recordUnit.trim()) {
      return null;
    }

    const sanitizedRecord: PersonalRecord = {
      recordName: recordName.trim(),
      record: recordValue,
      recordUnit: recordUnit.trim(),
    };

    if (typeof exerciseType === 'string' && exerciseType.trim()) {
      sanitizedRecord.exerciseType = exerciseType as PersonalRecord['exerciseType'];
    }

    if (typeof date === 'string' && date) {
      const parsedDate = new Date(date);
      if (!Number.isNaN(parsedDate.getTime())) {
        sanitizedRecord.date = parsedDate;
      }
    }

    return sanitizedRecord;
  }

  private mergePersonalRecords(incomingRecords: PersonalRecord[]): void {
    const storedValue = this.localStorageService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const existingRecords: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    const recordsByName = new Map<string, PersonalRecord>();
    existingRecords.forEach((record) => recordsByName.set(record.recordName, record));
    incomingRecords.forEach((record) => recordsByName.set(record.recordName, record));

    const mergedRecords = Array.from(recordsByName.values());
    this.localStorageService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(mergedRecords));
  }
}

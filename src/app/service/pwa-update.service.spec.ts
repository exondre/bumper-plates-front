import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdateService, PwaUpdateState } from './pwa-update.service';

class SwUpdateMock {
  isEnabled = true;
  readonly versionUpdates = new Subject<any>();
  readonly unrecoverable = new Subject<any>();
  readonly checkForUpdate = jasmine.createSpy('checkForUpdate').and.resolveTo(false);
  readonly activateUpdate = jasmine.createSpy('activateUpdate').and.resolveTo(true);
}

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let swUpdateMock: SwUpdateMock;
  let latestState: PwaUpdateState;

  beforeEach(() => {
    sessionStorage.clear();
    swUpdateMock = new SwUpdateMock();

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
      ],
    });

    service = TestBed.inject(PwaUpdateService);
    latestState = {
      status: 'idle',
      latestHash: null,
      latestVersionLabel: null,
    };
    service.updateState$.subscribe(state => {
      latestState = state;
    });
  });

  it('should expose an available state when VERSION_READY is emitted', () => {
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });

    expect(latestState).toEqual({
      status: 'available',
      latestHash: 'hash-latest',
      latestVersionLabel: '0.13.0',
    });
  });

  it('should not show the same update hash again after dismissing in the same session', () => {
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });
    service.dismissForSession();

    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });

    expect(latestState).toEqual({
      status: 'idle',
      latestHash: null,
      latestVersionLabel: null,
    });
  });

  it('should activate and reload when accepting an available update', async () => {
    const reloadSpy = spyOn<any>(service, 'reloadPage');
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });

    await service.acceptUpdate();

    expect(swUpdateMock.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should use the latest hash prefix when appData version is missing', () => {
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: { hash: 'aabbccddeeff' },
    });

    expect(latestState).toEqual({
      status: 'available',
      latestHash: 'aabbccddeeff',
      latestVersionLabel: 'aabbccdd',
    });
  });
});

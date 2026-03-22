import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { fakeAsync, tick } from '@angular/core/testing';
import { Subject, Subscription } from 'rxjs';
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
  let stateSub: Subscription;

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
    stateSub = service.updateState$.subscribe(state => {
      latestState = state;
    });
  });

  afterEach(() => {
    stateSub.unsubscribe();
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

  it('does not activate updates when service workers are disabled', async () => {
    swUpdateMock.isEnabled = false;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
      ],
    });

    service = TestBed.inject(PwaUpdateService);
    await service.acceptUpdate();

    expect(swUpdateMock.activateUpdate).not.toHaveBeenCalled();
  });

  it('handles activation failures by exposing an error state', async () => {
    const consoleErrorSpy = spyOn(console, 'error');
    swUpdateMock.activateUpdate.and.rejectWith(new Error('boom'));
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });

    await service.acceptUpdate();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(latestState).toEqual({
      status: 'error',
      latestHash: 'hash-latest',
      latestVersionLabel: '0.13.0',
    });
  });

  it('ignores dismiss calls when there is no available hash and avoids duplicate ready states', () => {
    service.dismissForSession();
    expect(latestState.status).toBe('idle');

    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });
    swUpdateMock.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'hash-current' },
      latestVersion: {
        hash: 'hash-latest',
        appData: { version: '0.13.0' },
      },
    });

    expect(latestState.status).toBe('available');
    expect(latestState.latestHash).toBe('hash-latest');
  });

  it('checks for updates when the document becomes visible and throttles repeated checks', async () => {
    swUpdateMock.checkForUpdate.calls.reset();
    (service as any).lastCheckForUpdateAt = 0;
    spyOn(Date, 'now').and.returnValues(61_000, 62_000, 123_000);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    await (service as any).handleVisibilityChange();
    await (service as any).handleVisibilityChange();
    await (service as any).handleVisibilityChange();

    expect(swUpdateMock.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('skips visibility checks while the document is hidden', async () => {
    swUpdateMock.checkForUpdate.calls.reset();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    await (service as any).handleVisibilityChange();

    expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
  });

  it('reloads after an unrecoverable service worker error', fakeAsync(() => {
    const reloadSpy = spyOn<any>(service, 'reloadPage');

    swUpdateMock.unrecoverable.next({});
    tick(1500);

    expect(latestState.status).toBe('error');
    expect(reloadSpy).toHaveBeenCalled();
  }));

  it('logs storage errors while persisting dismissed hashes', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    spyOn(sessionStorage, 'setItem').and.throwError('storage blocked');
    spyOn(sessionStorage, 'getItem').and.throwError('storage blocked');
    spyOn(sessionStorage, 'removeItem').and.throwError('storage blocked');

    (service as any).persistDismissedHash('hash-1');
    expect((service as any).readDismissedHash()).toBeNull();
    (service as any).clearDismissedHash();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
  });

  it('cleans up listeners and subscriptions on destroy', () => {
    const removeEventListenerSpy = spyOn(document, 'removeEventListener');
    const unsubscribeSpy = spyOn((service as any).subscriptions, 'unsubscribe').and.callThrough();

    (service as any).cleanup();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', (service as any).handleVisibilityChange);
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

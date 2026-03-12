import { DestroyRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Subscription, filter } from 'rxjs';

/**
 * Represents the update lifecycle for the PWA update prompt.
 */
export type PwaUpdateState = {
  status: 'idle' | 'available' | 'activating' | 'error';
  latestHash: string | null;
  latestVersionLabel: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);
  private readonly updateStateSubject = new BehaviorSubject<PwaUpdateState>({
    status: 'idle',
    latestHash: null,
    latestVersionLabel: null,
  });
  readonly updateState$ = this.updateStateSubject.asObservable();
  private readonly subscriptions = new Subscription();
  private readonly dismissedUpdateHashStorageKey = 'bp_pwa_dismissed_update_hash';
  private readonly checkForUpdateThrottleMs = 60_000;
  private lastCheckForUpdateAt = 0;

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.subscriptions.add(
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(event => {
          this.handleVersionReady(event);
        }),
    );

    this.subscriptions.add(
      this.swUpdate.unrecoverable.subscribe(() => {
        this.setState({
          status: 'error',
          latestHash: this.updateStateSubject.value.latestHash,
          latestVersionLabel: this.updateStateSubject.value.latestVersionLabel,
        });
        this.reloadPage();
      }),
    );

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.destroyRef.onDestroy(() => this.cleanup());

    void this.triggerCheckForUpdate(true);
  }

  /**
   * Dismisses the current update prompt for the active browser session.
   */
  dismissForSession(): void {
    const currentHash = this.updateStateSubject.value.latestHash;
    if (!currentHash) {
      return;
    }

    this.persistDismissedHash(currentHash);
    this.setState({
      status: 'idle',
      latestHash: null,
      latestVersionLabel: null,
    });
  }

  /**
   * Activates the downloaded version and reloads the page.
   */
  async acceptUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    const currentHash = this.updateStateSubject.value.latestHash;
    this.setState({
      status: 'activating',
      latestHash: currentHash,
      latestVersionLabel: this.updateStateSubject.value.latestVersionLabel,
    });

    try {
      await this.swUpdate.activateUpdate();
      this.clearDismissedHash();
      this.reloadPage();
    } catch (error) {
      console.error(error);
      this.setState({
        status: 'error',
        latestHash: currentHash,
        latestVersionLabel: this.updateStateSubject.value.latestVersionLabel,
      });
    }
  }

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') {
      return;
    }

    void this.triggerCheckForUpdate(false);
  };

  private setState(state: PwaUpdateState): void {
    this.updateStateSubject.next(state);
  }

  private handleVersionReady(event: VersionReadyEvent): void {
    const latestHash = event.latestVersion.hash;
    const dismissedHash = this.readDismissedHash();
    const currentState = this.updateStateSubject.value;

    if (dismissedHash === latestHash) {
      return;
    }

    if (
      currentState.latestHash === latestHash &&
      (currentState.status === 'available' || currentState.status === 'activating')
    ) {
      return;
    }

    this.setState({
      status: 'available',
      latestHash,
      latestVersionLabel: this.resolveVersionLabel(event),
    });
  }

  private resolveVersionLabel(event: VersionReadyEvent): string {
    const appData = event.latestVersion.appData;
    if (this.hasVersionAppData(appData)) {
      return appData.version;
    }

    return event.latestVersion.hash.slice(0, 8);
  }

  private hasVersionAppData(value: object | undefined): value is { version: string } {
    return !!value && 'version' in value && typeof (value as { version?: unknown }).version === 'string';
  }

  private async triggerCheckForUpdate(force: boolean): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastCheckForUpdateAt < this.checkForUpdateThrottleMs) {
      return;
    }

    this.lastCheckForUpdateAt = now;

    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error(error);
    }
  }

  private persistDismissedHash(hash: string): void {
    try {
      sessionStorage.setItem(this.dismissedUpdateHashStorageKey, hash);
    } catch (error) {
      console.error(error);
    }
  }

  private readDismissedHash(): string | null {
    try {
      return sessionStorage.getItem(this.dismissedUpdateHashStorageKey);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private clearDismissedHash(): void {
    try {
      sessionStorage.removeItem(this.dismissedUpdateHashStorageKey);
    } catch (error) {
      console.error(error);
    }
  }

  private reloadPage(): void {
    window.location.reload();
  }

  private cleanup(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.subscriptions.unsubscribe();
  }
}

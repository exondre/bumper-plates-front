import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { SharedService } from './service/shared.service';
import { PwaUpdateService, PwaUpdateState } from './service/pwa-update.service';

class SharedServiceMock {
  getPreferences() {
    return of({
      showAllPersonalRecords: false,
      colorScheme: 'auto',
    });
  }
}

class PwaUpdateServiceMock {
  private readonly stateSubject = new BehaviorSubject<PwaUpdateState>({
    status: 'idle',
    latestHash: null,
    latestVersionLabel: null,
  });
  readonly updateState$ = this.stateSubject.asObservable();
  readonly dismissForSession = jasmine.createSpy('dismissForSession');
  readonly acceptUpdate = jasmine.createSpy('acceptUpdate').and.resolveTo();

  emitState(state: PwaUpdateState): void {
    this.stateSubject.next(state);
  }
}

describe('AppComponent', () => {
  let pwaUpdateServiceMock: PwaUpdateServiceMock;

  beforeEach(async () => {
    pwaUpdateServiceMock = new PwaUpdateServiceMock();
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        { provide: SharedService, useClass: SharedServiceMock },
        { provide: PwaUpdateService, useValue: pwaUpdateServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show update sheet when a new version is available', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    pwaUpdateServiceMock.emitState({
      status: 'available',
      latestHash: 'hash-1',
      latestVersionLabel: '0.13.0',
    });
    fixture.detectChanges();

    const updateSheet = fixture.nativeElement.querySelector('.pwa-update-sheet');
    expect(updateSheet).toBeTruthy();
  });

  it('should forward update sheet actions to the PWA update service', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    pwaUpdateServiceMock.emitState({
      status: 'available',
      latestHash: 'hash-1',
      latestVersionLabel: '0.13.0',
    });
    fixture.detectChanges();

    const dismissButton = fixture.nativeElement.querySelector('.btn-outline-secondary') as HTMLButtonElement;
    const acceptButton = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;

    dismissButton.click();
    acceptButton.click();

    expect(pwaUpdateServiceMock.dismissForSession).toHaveBeenCalledTimes(1);
    expect(pwaUpdateServiceMock.acceptUpdate).toHaveBeenCalledTimes(1);
  });
});

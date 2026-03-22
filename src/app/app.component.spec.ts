import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { SharedService } from './service/shared.service';
import { PwaUpdateService, PwaUpdateState } from './service/pwa-update.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let routerEvents$: Subject<NavigationStart | NavigationEnd>;
  let routerStub: { url: string; events: ReturnType<Subject<NavigationStart | NavigationEnd>['asObservable']> };
  let preferences$: BehaviorSubject<any>;
  let sharedService: any;
  let pwaUpdateService: any;
  let mediaQueryList: {
    matches: boolean;
    addEventListener: jasmine.Spy;
    removeEventListener: jasmine.Spy;
  };

  const createComponent = (url = '/home') => {
    routerStub.url = url;
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    routerEvents$ = new Subject<NavigationStart | NavigationEnd>();
    routerStub = {
      url: '/home',
      events: routerEvents$.asObservable(),
    };
    preferences$ = new BehaviorSubject({
      showAllPersonalRecords: false,
      colorScheme: 'auto',
    });
    sharedService = {
      getPreferences: jasmine.createSpy('getPreferences').and.returnValue(preferences$.asObservable()),
      patchMarksViewState: jasmine.createSpy('patchMarksViewState'),
      getMarksViewStateSnapshot: jasmine.createSpy('getMarksViewStateSnapshot').and.returnValue({ scrollTop: 44 }),
    };
    pwaUpdateService = {
      updateState$: new BehaviorSubject<PwaUpdateState>({
        status: 'idle',
        latestHash: null,
        latestVersionLabel: null,
      }).asObservable(),
      dismissForSession: jasmine.createSpy('dismissForSession'),
      acceptUpdate: jasmine.createSpy('acceptUpdate').and.resolveTo(),
    };
    mediaQueryList = {
      matches: true,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy().and.returnValue(mediaQueryList),
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: SharedService, useValue: sharedService },
        { provide: PwaUpdateService, useValue: pwaUpdateService },
      ],
    })
      .overrideComponent(AppComponent, {
        set: {
          template: '<main #appContent></main>',
        },
      })
      .compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('should create and initialize the home header state', () => {
    createComponent('/home');

    expect(component).toBeTruthy();
    expect(component.hideHeader).toBeTrue();
  });

  it('applies color schemes and reacts to system dark mode changes', () => {
    createComponent('/home');

    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', (component as any).darkModeListener);

    preferences$.next({ showAllPersonalRecords: false, colorScheme: 'light' });
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', (component as any).darkModeListener);

    preferences$.next({ showAllPersonalRecords: false, colorScheme: 'auto' });
    (component as any).darkModeListener({ matches: false } as MediaQueryListEvent);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('captures and restores marks scroll position during navigation', () => {
    createComponent('/marcas');
    const appContent = { scrollTop: 0 } as HTMLElement;
    component.appContentRef = new ElementRef(appContent);
    appContent.scrollTop = 120;
    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    routerEvents$.next(new NavigationStart(1, '/home'));
    expect(sharedService.patchMarksViewState).toHaveBeenCalledWith({ scrollTop: 120 });

    routerEvents$.next(new NavigationEnd(2, '/marcas', '/marcas'));
    expect(component.hideHeader).toBeFalse();
    expect(appContent.scrollTop).toBe(44);
  });

  it('handles marks route helpers and ignores non-marks routes', () => {
    createComponent('/calculadora');
    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    expect((component as any).isMarksRoute('/marcas?tab=latest#anchor')).toBeTrue();
    expect((component as any).isMarksRoute('/home')).toBeFalse();

    (component as any).captureMarksScrollPosition('/home');
    (component as any).restoreMarksScrollPosition('/home');
    expect(sharedService.patchMarksViewState).not.toHaveBeenCalled();

    component.appContentRef = undefined;
    (component as any).captureMarksScrollPosition('/marcas');
    (component as any).restoreMarksScrollPosition('/marcas');
    expect(sharedService.patchMarksViewState).not.toHaveBeenCalled();
  });

  it('forwards update actions to the pwa update service', () => {
    createComponent('/home');

    component.onDismissPwaUpdate();
    component.onAcceptPwaUpdate();

    expect(pwaUpdateService.dismissForSession).toHaveBeenCalled();
    expect(pwaUpdateService.acceptUpdate).toHaveBeenCalled();
  });

  it('captures marks scroll state and removes listeners on destroy', () => {
    createComponent('/marcas');
    const appContent = { scrollTop: 0 } as HTMLElement;
    component.appContentRef = new ElementRef(appContent);
    appContent.scrollTop = 88;
    (component as any).darkModeListenerActive = true;
    const unsubscribeSpy = spyOn((component as any).subscriptions, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(sharedService.patchMarksViewState).toHaveBeenCalledWith({ scrollTop: 88 });
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', (component as any).darkModeListener);
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

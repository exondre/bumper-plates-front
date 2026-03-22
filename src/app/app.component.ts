import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SharedService } from './service/shared.service';
import { PwaUpdateService } from './service/pwa-update.service';
import { PwaUpdateSheetComponent } from './shared/components/pwa-update-sheet/pwa-update-sheet.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, PwaUpdateSheetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('appContent') appContentRef?: ElementRef<HTMLElement>;

  hideHeader = false;
  readonly pwaUpdateState$ = this.pwaUpdateService.updateState$;
  private darkModeQuery: MediaQueryList | null = null;
  private darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
  private darkModeListenerActive = false;
  private subscriptions = new Subscription();
  private previousUrl = '';

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private pwaUpdateService: PwaUpdateService,
  ) {
    this.hideHeader = this.router.url === '/home';
    this.previousUrl = this.router.url;
    this.subscriptions.add(
      this.router.events
        .pipe(filter((e): e is NavigationStart | NavigationEnd => e instanceof NavigationStart || e instanceof NavigationEnd))
        .subscribe((event) => {
          if (event instanceof NavigationStart) {
            this.captureMarksScrollPosition(this.previousUrl);
            return;
          }

          this.hideHeader = event.urlAfterRedirects === '/home';
          this.restoreMarksScrollPosition(event.urlAfterRedirects);
          this.previousUrl = event.urlAfterRedirects;
        }),
    );

    this.initDarkMode();

    this.subscriptions.add(
      this.sharedService.getPreferences().subscribe(preferences => {
        this.applyColorScheme(preferences.colorScheme);
      }),
    );
  }

  ngAfterViewInit(): void {
    this.restoreMarksScrollPosition(this.router.url);
  }

  private initDarkMode(): void {
    this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeListener = (e: MediaQueryListEvent) => this.applyTheme(e.matches);
  }

  private applyColorScheme(scheme: 'auto' | 'light' | 'dark' | undefined): void {
    if (!scheme || scheme === 'auto') {
      this.applyTheme(this.darkModeQuery?.matches ?? false);
      if (this.darkModeQuery && this.darkModeListener && !this.darkModeListenerActive) {
        this.darkModeQuery.addEventListener('change', this.darkModeListener);
        this.darkModeListenerActive = true;
      }
    } else {
      if (this.darkModeQuery && this.darkModeListener && this.darkModeListenerActive) {
        this.darkModeQuery.removeEventListener('change', this.darkModeListener);
        this.darkModeListenerActive = false;
      }
      document.documentElement.setAttribute('data-bs-theme', scheme);
    }
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  }

  /**
   * Stores the current marcas tab scroll position before leaving the route.
   */
  private captureMarksScrollPosition(url: string): void {
    if (!this.isMarksRoute(url)) {
      return;
    }

    const appContent = this.appContentRef?.nativeElement;
    if (!appContent) {
      return;
    }

    this.sharedService.patchMarksViewState({
      scrollTop: appContent.scrollTop,
    });
  }

  /**
   * Restores the marcas tab scroll position when returning to the route.
   */
  private restoreMarksScrollPosition(url: string): void {
    if (!this.isMarksRoute(url)) {
      return;
    }

    requestAnimationFrame(() => {
      const appContent = this.appContentRef?.nativeElement;
      if (!appContent) {
        return;
      }

      appContent.scrollTop = this.sharedService.getMarksViewStateSnapshot().scrollTop;
    });
  }

  /**
   * Checks whether a URL corresponds to the marcas tab route.
   */
  private isMarksRoute(url: string): boolean {
    const normalizedUrl = url.split('?')[0].split('#')[0];
    return normalizedUrl === '/marcas';
  }

  /**
   * Dismisses the current update prompt for the active session.
   */
  onDismissPwaUpdate(): void {
    this.pwaUpdateService.dismissForSession();
  }

  /**
   * Accepts the available update and starts the activation flow.
   */
  onAcceptPwaUpdate(): void {
    void this.pwaUpdateService.acceptUpdate();
  }

  ngOnDestroy(): void {
    this.captureMarksScrollPosition(this.previousUrl);

    if (this.darkModeQuery && this.darkModeListener && this.darkModeListenerActive) {
      this.darkModeQuery.removeEventListener('change', this.darkModeListener);
      this.darkModeListenerActive = false;
    }
    this.subscriptions.unsubscribe();
  }
}

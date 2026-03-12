import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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
export class AppComponent implements OnDestroy {
  hideHeader = false;
  readonly pwaUpdateState$ = this.pwaUpdateService.updateState$;
  private darkModeQuery: MediaQueryList | null = null;
  private darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
  private darkModeListenerActive = false;
  private preferencesSub: Subscription = new Subscription();

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private pwaUpdateService: PwaUpdateService,
  ) {
    this.hideHeader = this.router.url === '/home';
    this.preferencesSub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => { this.hideHeader = e.urlAfterRedirects === '/home'; }),
    );

    this.initDarkMode();

    this.preferencesSub = this.sharedService.getPreferences().subscribe(preferences => {
      this.applyColorScheme(preferences.colorScheme);
    });
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
    if (this.darkModeQuery && this.darkModeListener && this.darkModeListenerActive) {
      this.darkModeQuery.removeEventListener('change', this.darkModeListener);
      this.darkModeListenerActive = false;
    }
    this.preferencesSub.unsubscribe();
  }
}

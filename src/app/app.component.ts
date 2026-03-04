import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SharedService } from './service/shared.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnDestroy {
  hideHeader = false;
  private darkModeQuery: MediaQueryList | null = null;
  private darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
  private preferencesSub: Subscription = new Subscription();

  constructor(private router: Router, private sharedService: SharedService) {
    this.hideHeader = this.router.url === '/home';
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => { this.hideHeader = e.urlAfterRedirects === '/home'; });

    this.initDarkMode();

    this.preferencesSub = this.sharedService.getPreferences().subscribe(preferences => {
      this.applyColorScheme(preferences.colorScheme);
    });
  }

  private initDarkMode(): void {
    this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeListener = (e: MediaQueryListEvent) => this.applyTheme(e.matches);
    this.darkModeQuery.addEventListener('change', this.darkModeListener);
  }

  private applyColorScheme(scheme: 'auto' | 'light' | 'dark' | undefined): void {
    if (!scheme || scheme === 'auto') {
      this.applyTheme(this.darkModeQuery?.matches ?? false);
      if (this.darkModeQuery && this.darkModeListener) {
        this.darkModeQuery.removeEventListener('change', this.darkModeListener);
        this.darkModeQuery.addEventListener('change', this.darkModeListener);
      }
    } else {
      if (this.darkModeQuery && this.darkModeListener) {
        this.darkModeQuery.removeEventListener('change', this.darkModeListener);
      }
      document.documentElement.setAttribute('data-bs-theme', scheme);
    }
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  }

  ngOnDestroy(): void {
    if (this.darkModeQuery && this.darkModeListener) {
      this.darkModeQuery.removeEventListener('change', this.darkModeListener);
    }
    this.preferencesSub.unsubscribe();
  }
}

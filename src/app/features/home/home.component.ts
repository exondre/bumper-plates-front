
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { LocalStorageService } from '../../service/local-storage.service';
import { SharedService } from '../../service/shared.service';
import { LSKeysEnum } from '../../shared/enums/LSKeysEnum';
import { ExerciseEnum } from '../../shared/enums/ExerciseEnum';
import { MarksNavigationState } from '../../shared/interfaces/marks-navigation-state.interface';
import { ExerciseLabelPipe } from '../../shared/pipes/exercise-label.pipe';
import { PersonalRecord } from '../personal-records/personal-record.interface';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ExerciseLabelPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly version: string = (packageJson as { version: string }).version;

  latestRecords: PersonalRecord[] = [];

  private reloadSub: Subscription = new Subscription();

  constructor(
    private lsService: LocalStorageService,
    private sharedService: SharedService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadLatestRecords();

    this.reloadSub = this.sharedService.getReloadPR().subscribe(() => {
      this.loadLatestRecords();
    });
  }

  ngOnDestroy(): void {
    this.reloadSub.unsubscribe();
  }

  /**
   * Navigates to the marcas tab with a transient preselection intent.
   */
  openRecordInMarks(record: PersonalRecord): void {
    const navigationState: MarksNavigationState = {
      source: 'home-best-records',
      preselectedRecord: {
        recordName: record.recordName,
        record: record.record,
        recordUnit: record.recordUnit,
        exerciseType: record.exerciseType,
        date: record.date,
      },
    };

    void this.router.navigate(['/marcas'], {
      state: navigationState,
    });
  }

  private loadLatestRecords(): void {
    const storedValue = this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS);
    const records: PersonalRecord[] = storedValue ? JSON.parse(storedValue) : [];

    const latestByExercise = new Map<string, PersonalRecord>();

    for (const record of records) {
      const key = record.exerciseType ?? ExerciseEnum.NONE;
      const existing = latestByExercise.get(key);

      if (!existing || this.toTimestamp(record) > this.toTimestamp(existing)) {
        latestByExercise.set(key, record);
      }
    }

    this.latestRecords = Array.from(latestByExercise.values());
  }

  private toTimestamp(record: PersonalRecord): number {
    const rawDate = record.date;
    if (!rawDate) {
      return Number.NEGATIVE_INFINITY;
    }
    const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
    const timestamp = parsedDate.getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  }
}


import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../../service/shared.service';
import { WeightUnitEnum } from '../../shared/enums/weight-unit.enum';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, OnDestroy {
  /** Current application version. */
  readonly version: string = (packageJson as { version: string }).version;

  /** Available barbell options. */
  barbellList: { value: number; unit: WeightUnitEnum }[] = [
    { value: 20, unit: WeightUnitEnum.KG },
    { value: 15, unit: WeightUnitEnum.KG },
    { value: 45, unit: WeightUnitEnum.LBS },
    { value: 35, unit: WeightUnitEnum.LBS },
  ];

  /** Currently selected barbell preference. */
  selectedBarbell: { value: number; unit: WeightUnitEnum } | null = null;

  /** Available plate unit options. */
  platesUnitList: WeightUnitEnum[] = [
    WeightUnitEnum.KG,
    WeightUnitEnum.LBS,
  ];

  /** Currently selected plates unit preference. */
  selectedPlatesUnit: WeightUnitEnum | null = null;

  /** Available marks display options. */
  marksDisplayOptions: { label: string; value: boolean }[] = [
    { label: 'Las más recientes', value: false },
    { label: 'Todas', value: true },
  ];

  /** Whether to show all personal records or only the latest ones. */
  showAllRecords: boolean = false;

  private preferencesSub: Subscription = new Subscription();

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.preferencesSub = this.sharedService.getPreferences().subscribe(preferences => {
      this.selectedBarbell = preferences.preferredBarbell
        ?? this.barbellList[0];
      this.selectedPlatesUnit = preferences.preferredPlatesUnits
        ?? WeightUnitEnum.KG;
      this.showAllRecords = Boolean(preferences.showAllPersonalRecords);
    });
  }

  /**
   * Updates the preferred barbell and persists the change.
   */
  selectBarbell(barbell: { value: number; unit: WeightUnitEnum }): void {
    this.selectedBarbell = barbell;
    this.sharedService.updatePreferences({ preferredBarbell: barbell });
  }

  /**
   * Updates the preferred plates unit and persists the change.
   */
  selectPlatesUnit(unit: WeightUnitEnum): void {
    this.selectedPlatesUnit = unit;
    this.sharedService.updatePreferences({ preferredPlatesUnits: unit });
  }

  /**
   * Updates the marks display preference and persists the change.
   */
  selectMarksDisplay(showAll: boolean): void {
    this.showAllRecords = showAll;
    this.sharedService.updatePreferences({ showAllPersonalRecords: showAll });
  }

  ngOnDestroy(): void {
    this.preferencesSub.unsubscribe();
  }
}

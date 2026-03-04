
import { Component, Input, OnInit } from '@angular/core';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { LocalStorageService } from '../../../service/local-storage.service';
import { SharedService } from '../../../service/shared.service';
import { ExerciseLabelPipe } from '../../../shared/pipes/exercise-label.pipe';
import { PersonalRecord } from '../personal-record.interface';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-new-pr',
    imports: [ExerciseLabelPipe, FormsModule],
    templateUrl: './new-pr.component.html',
    styleUrl: './new-pr.component.scss'
})
export class NewPrComponent implements OnInit {
  @Input() editRecord: PersonalRecord | null = null;

  weightRecord: number = 0;
  weightRecordName: string = '';
  weightRecordUnit: string = 'kg';
  recordExcerciseType: ExerciseEnum = ExerciseEnum.NONE;

  ExerciseEnum = ExerciseEnum;
  exerciseTypes: string[] = Object.values(ExerciseEnum);

  get isEditMode(): boolean {
    return this.editRecord !== null;
  }

  constructor(
    private sharedService: SharedService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    if (this.editRecord) {
      this.weightRecordName = this.editRecord.recordName;
      this.weightRecord = this.editRecord.record;
      this.weightRecordUnit = this.editRecord.recordUnit;
      this.recordExcerciseType = this.editRecord.exerciseType ?? ExerciseEnum.NONE;
    }
  }

  saveNewRecord() {
    const personalRecords: PersonalRecord[] =
      JSON.parse(
        this.localStorageService.getItem(LSKeysEnum.PERSONAL_RECORDS)
      ) ?? [];

    const newPR: PersonalRecord = {
      recordName: this.weightRecordName,
      record: this.weightRecord,
      recordUnit: this.weightRecordUnit,
      exerciseType: this.recordExcerciseType,
      date: new Date(),
    };

    if (this.isEditMode) {
      const index = personalRecords.findIndex(
        (p) =>
          p.recordName === this.editRecord!.recordName &&
          p.record === this.editRecord!.record &&
          p.recordUnit === this.editRecord!.recordUnit
      );
      if (index !== -1) {
        personalRecords[index] = newPR;
      }
    } else {
      personalRecords.push(newPR);
    }

    this.localStorageService.setItem(
      LSKeysEnum.PERSONAL_RECORDS,
      JSON.stringify(personalRecords)
    );
    this.sharedService.sendReloadPR();
    this.cancelNewRecord();
  }

  cancelNewRecord() {
    this.setDefaultValues();
    this.sharedService.sendShowNewPR(false);
  }

  private setDefaultValues() {
    this.weightRecord = 0;
    this.weightRecordName = '';
    this.weightRecordUnit = 'kg';
  }
}

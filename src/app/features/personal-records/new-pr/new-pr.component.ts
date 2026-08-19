
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EXERCISE_GROUPS, isExerciseType } from '../../../shared/constants/exercise-catalog';
import { ExerciseEnum } from '../../../shared/enums/ExerciseEnum';
import { LSKeysEnum } from '../../../shared/enums/LSKeysEnum';
import { LocalStorageService } from '../../../service/local-storage.service';
import { SharedService } from '../../../service/shared.service';
import { PersonalRecord } from '../personal-record.interface';

@Component({
  selector: 'app-new-pr',
  imports: [FormsModule],
  templateUrl: './new-pr.component.html',
  styleUrl: './new-pr.component.scss',
})
export class NewPrComponent implements OnInit {
  @Input() editRecord: PersonalRecord | null = null;

  weightRecord: number = 0;
  weightRecordName: string = '';
  weightRecordUnit: string = 'kg';
  recordExcerciseType: ExerciseEnum = ExerciseEnum.NONE;

  readonly exerciseGroups = EXERCISE_GROUPS;

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
      this.recordExcerciseType = isExerciseType(this.editRecord.exerciseType)
        ? this.editRecord.exerciseType
        : ExerciseEnum.NONE;
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
      exerciseType: isExerciseType(this.recordExcerciseType)
        ? this.recordExcerciseType
        : ExerciseEnum.NONE,
      date: this.isEditMode ? this.editRecord?.date : new Date(),
    };

    if (this.isEditMode) {
      const editedRecord = this.editRecord!;
      const editedRecordDate = editedRecord.date instanceof Date
        ? editedRecord.date.toISOString()
        : editedRecord.date;
      const index = personalRecords.findIndex(
        (personalRecord) => {
          const personalRecordDate = personalRecord.date instanceof Date
            ? personalRecord.date.toISOString()
            : personalRecord.date;

          return personalRecord.recordName === editedRecord.recordName
            && personalRecord.record === editedRecord.record
            && personalRecord.recordUnit === editedRecord.recordUnit
            && personalRecord.exerciseType === editedRecord.exerciseType
            && personalRecordDate === editedRecordDate;
        },
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

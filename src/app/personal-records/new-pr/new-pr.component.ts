import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../service/shared.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { LSKeysEnum } from '../../enums/LSKeysEnum';

@Component({
  selector: 'app-new-pr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-pr.component.html',
  styleUrl: './new-pr.component.scss'
})
export class NewPrComponent {
  weightRecord: number = 0;
  weightRecordName: string = '';
  weightRecordUnit: string = 'kg';

  constructor(private sharedService: SharedService, private localStorageService: LocalStorageService) {}

  saveNewRecord() {
    const personalRecords = JSON.parse(this.localStorageService.getItem(LSKeysEnum.PERSONAL_RECORDS)) ?? [];

    const newPR = {recordName: this.weightRecordName, record: this.weightRecord, recordUnit: this.weightRecordUnit};
    personalRecords.push(newPR);

    this.localStorageService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(personalRecords));
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

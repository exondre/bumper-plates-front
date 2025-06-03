import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../service/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocalStorageService } from '../service/local-storage.service';
import { LSKeysEnum } from '../enums/LSKeysEnum';
import { NewPrComponent } from './new-pr/new-pr.component';

@Component({
    selector: 'app-personal-records',
    imports: [CommonModule, NewPrComponent],
    templateUrl: './personal-records.component.html',
    styleUrl: './personal-records.component.scss'
})
export class PersonalRecordsComponent implements OnDestroy, OnInit {
  personalRecords: any[] = [];
  showNewPR: boolean = false;
  showNewPRSubscription: Subscription;
  reloadPRSubscription: Subscription;

  constructor(private sharedService: SharedService, private lsService: LocalStorageService) {
    this.showNewPRSubscription = this.sharedService.getShowNewPR().subscribe( s => {
      this.showNewPR = s;
    });

    this.reloadPRSubscription = this.sharedService.getReloadPR().subscribe( r => {
      if (r) {
        this.loadPersonalRecords();
      }
    });
  }

  ngOnInit(): void {
    this.loadPersonalRecords();
  }

  ngOnDestroy(): void {
      this.showNewPRSubscription.unsubscribe();
      this.reloadPRSubscription.unsubscribe();
  }

  addNewPR() {
    this.showNewPR = true;
  }

  deletePR(pr: any) {
    const newPR = this.personalRecords.filter( (p: any) => p !== pr);
    this.lsService.setItem(LSKeysEnum.PERSONAL_RECORDS, JSON.stringify(newPR));
    this.loadPersonalRecords();
  }

  loadPersonalRecords() {
    this.personalRecords = JSON.parse(this.lsService.getItem(LSKeysEnum.PERSONAL_RECORDS)) ?? [];
  }

  sendToPercentageCalculator(ev: MouseEvent, p: any) {
    ev.preventDefault();
    this.sharedService.sendSelectedPREvent(p);
    // console.log(`${weight} ${unit}.`);
  }
}

// shared.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private selectedPercentage = new Subject<any>();
  private showNewPR = new Subject<any>();
  private reloadPR = new Subject<boolean>();
  private selectedPR = new Subject<any>();

  readonly poundToKiloFactor = 0.453592;
  readonly kiloToPoundFactor = 2.20462;

  sendSelectedPercentageEvent(data: any) {
    this.selectedPercentage.next(data);
  }

  getSelectedPercentageEvent() {
    return this.selectedPercentage.asObservable();
  }

  sendShowNewPR(data: any) {
    this.showNewPR.next(data);
  }

  getShowNewPR() {
    return this.showNewPR.asObservable();
  }

  sendReloadPR() {
    this.reloadPR.next(true);
  }

  getReloadPR() {
    return this.reloadPR.asObservable();
  }

  sendSelectedPREvent(data: any) {
    this.selectedPR.next(data);
  }

  getSelectedPREvent() {
    return this.selectedPR.asObservable();
  }
}

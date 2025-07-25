// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TrainingSession, TrainingWeek } from '../features/training/training.interface';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private selectedPercentage = new BehaviorSubject<any>(null);
  private showNewPR = new Subject<any>();
  private reloadPR = new Subject<boolean>();
  private selectedPR = new BehaviorSubject<any>(null);
  private selectedWeek = new BehaviorSubject<TrainingWeek | null>(null);
  private selectedSession = new BehaviorSubject<TrainingSession | null>(null);

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

  setSelectedWeek(week: TrainingWeek | null) {
    this.selectedWeek.next(week);
  }

  getSelectedWeek() {
    return this.selectedWeek.asObservable();
  }

  setSelectedSession(session: TrainingSession | null) {
    this.selectedSession.next(session);
  }

  getSelectedSession() {
    return this.selectedSession.asObservable();
  }
}

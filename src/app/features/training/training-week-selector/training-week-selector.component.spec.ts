import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingWeekSelectorComponent } from './training-week-selector.component';

describe('TrainingWeekSelectorComponent', () => {
  let component: TrainingWeekSelectorComponent;
  let fixture: ComponentFixture<TrainingWeekSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingWeekSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingWeekSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

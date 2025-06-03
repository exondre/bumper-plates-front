import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingCsvLoaderComponent } from './training-csv-loader.component';

describe('TrainingCsvLoaderComponent', () => {
  let component: TrainingCsvLoaderComponent;
  let fixture: ComponentFixture<TrainingCsvLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingCsvLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingCsvLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

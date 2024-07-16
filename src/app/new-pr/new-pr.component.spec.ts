import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPrComponent } from './new-pr.component';

describe('NewPrComponent', () => {
  let component: NewPrComponent;
  let fixture: ComponentFixture<NewPrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPrComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewPrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

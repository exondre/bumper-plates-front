import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BumperPlatesCalculatorComponent } from './bumper-plates-calculator.component';

describe('BumperPlatesCalculatorComponent', () => {
  let component: BumperPlatesCalculatorComponent;
  let fixture: ComponentFixture<BumperPlatesCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BumperPlatesCalculatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BumperPlatesCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

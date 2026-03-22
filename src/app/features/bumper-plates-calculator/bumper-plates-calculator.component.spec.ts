import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SharedService } from '../../service/shared.service';
import { BumperPlatesCalculatorComponent } from './bumper-plates-calculator.component';

describe('BumperPlatesCalculatorComponent', () => {
  let component: BumperPlatesCalculatorComponent;
  let fixture: ComponentFixture<BumperPlatesCalculatorComponent>;
  let selectedPercentage$: Subject<any>;
  let sharedService: jasmine.SpyObj<SharedService> & {
    poundToKiloFactor: number;
    kiloToPoundFactor: number;
  };

  beforeEach(async () => {
    selectedPercentage$ = new Subject();
    sharedService = Object.assign(
      jasmine.createSpyObj<SharedService>('SharedService', ['getSelectedPercentageEvent']),
      {
        poundToKiloFactor: 0.453592,
        kiloToPoundFactor: 2.20462,
      },
    );
    sharedService.getSelectedPercentageEvent.and.returnValue(selectedPercentage$.asObservable());

    await TestBed.configureTestingModule({
      imports: [BumperPlatesCalculatorComponent],
      providers: [
        { provide: SharedService, useValue: sharedService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BumperPlatesCalculatorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('listens to percentage events in internal mode and recalculates', () => {
    const calculateSpy = spyOn(component, 'calculate').and.callThrough();

    fixture.detectChanges();
    selectedPercentage$.next({ percentageWeight: 140, unit: 'kg' });

    expect(component.desiredWeight).toBe(140);
    expect(component.desiredWeightUnit).toBe('kg');
    expect(calculateSpy).toHaveBeenCalled();
    expect(component.requiredBumpers.length).toBeGreaterThan(0);
  });

  it('applies external inputs on init and only recalculates when they change', () => {
    const calculateSpy = spyOn(component, 'calculate').and.callThrough();

    fixture.componentRef.setInput('externalInputModeInput', true);
    fixture.componentRef.setInput('initialWeightInput', 20);
    fixture.componentRef.setInput('initialWeightUnitInput', 'kg');
    fixture.componentRef.setInput('desiredWeightInput', 100);
    fixture.componentRef.setInput('desiredWeightUnitInput', 'kg');
    fixture.componentRef.setInput('preferredPlatesUnitInput', 'kg');

    fixture.detectChanges();
    const initialCalls = calculateSpy.calls.count();

    fixture.detectChanges();
    expect(calculateSpy.calls.count()).toBe(initialCalls);

    fixture.componentRef.setInput('desiredWeightInput', 110);
    fixture.detectChanges();

    expect(component.externalInputMode).toBeTrue();
    expect(component.desiredWeight).toBe(110);
    expect(calculateSpy.calls.count()).toBeGreaterThan(initialCalls);
  });

  it('turns off external mode when the external input mode signal becomes false', () => {
    fixture.componentRef.setInput('externalInputModeInput', true);
    fixture.componentRef.setInput('initialWeightInput', 20);
    fixture.componentRef.setInput('initialWeightUnitInput', 'kg');
    fixture.componentRef.setInput('desiredWeightInput', 100);
    fixture.componentRef.setInput('desiredWeightUnitInput', 'kg');
    fixture.detectChanges();

    expect(component.externalInputMode).toBeTrue();

    fixture.componentRef.setInput('externalInputModeInput', false);
    fixture.detectChanges();

    expect(component.externalInputMode).toBeFalse();
  });

  it('recalculates in external mode when only the preferred plates unit changes', () => {
    const calculateSpy = spyOn(component, 'calculate').and.callThrough();

    fixture.componentRef.setInput('externalInputModeInput', true);
    fixture.componentRef.setInput('initialWeightInput', 20);
    fixture.componentRef.setInput('initialWeightUnitInput', 'kg');
    fixture.componentRef.setInput('desiredWeightInput', 100);
    fixture.componentRef.setInput('desiredWeightUnitInput', 'kg');
    fixture.componentRef.setInput('preferredPlatesUnitInput', 'kg');
    fixture.detectChanges();
    const callsBeforePreferenceChange = calculateSpy.calls.count();

    fixture.componentRef.setInput('preferredPlatesUnitInput', 'lbs');
    fixture.detectChanges();

    expect(calculateSpy.calls.count()).toBeGreaterThan(callsBeforePreferenceChange);
  });

  it('closes and swaps the desired weight into the initial weight', () => {
    const closedSpy = spyOn(component.closedSignal, 'emit');
    component.desiredWeight = 90;
    component.desiredWeightUnit = 'lbs';

    component.switchDesiredToInitial();
    component.close();

    expect(component.initialWeight).toBe(90);
    expect(component.initialWeightUnit).toBe('lbs');
    expect(component.desiredWeight).toBe(0);
    expect(closedSpy).toHaveBeenCalled();
  });

  it('calculates and stores the bumper breakdown', () => {
    spyOn(component, 'calculateBumpers').and.returnValue({
      requiredBumpers: [{
        bumperName: '25 kg',
        bumperUnit: 'kg',
        bumperOriginalUnit: 'kg',
        bumperValue: 25,
        bumperLimit: 1,
        quantity: 1,
      }],
      achievedWeight: 100,
      extraWeight: 0,
    });

    component.calculate();

    expect(component.requiredBumpers).toEqual([{
      bumperName: '25 kg',
      bumperUnit: 'kg',
      bumperOriginalUnit: 'kg',
      bumperValue: 25,
      bumperLimit: 1,
      quantity: 1,
    }]);
    expect(component.achievedWeight).toBe(100);
    expect(component.extraWeight).toBe(0);
  });

  it('calculates bumpers with preferred units, conversions and bumper limits', () => {
    const consoleLogSpy = spyOn(console, 'log');

    const result = component.calculateBumpers(20, 'kg', 220, 'kg', 'kg');

    expect(result.requiredBumpers.length).toBeGreaterThan(0);
    expect(result.requiredBumpers.every((bumper) => bumper.bumperOriginalUnit === 'kg')).toBeTrue();
    expect(result.requiredBumpers[0].quantity).toBe(1);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('filters large kilogram bumpers for pounds when no preference is set', () => {
    const result = component.calculateBumpers(45, 'lbs', 225, 'lbs');

    expect(result.requiredBumpers.length).toBeGreaterThan(0);
    expect(result.requiredBumpers.every((bumper) => (
      bumper.bumperOriginalUnit === 'lbs' || bumper.bumperValue < 5
    ))).toBeTrue();
    expect(result.achievedWeight).toBeGreaterThan(45);
  });

  it('unsubscribes from selected percentage events on destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = spyOn(component.selectedPercentageSuscription!, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

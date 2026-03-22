import { Subject } from 'rxjs';
import { SharedService } from '../../service/shared.service';
import { PercentageCalculatorComponent } from './percentage-calculator.component';

describe('PercentageCalculatorComponent', () => {
  let component: PercentageCalculatorComponent;
  let selectedPR$: Subject<any>;
  let sharedService: jasmine.SpyObj<SharedService> & {
    poundToKiloFactor: number;
    kiloToPoundFactor: number;
  };

  beforeEach(() => {
    selectedPR$ = new Subject();
    sharedService = Object.assign(
      jasmine.createSpyObj<SharedService>('SharedService', ['getSelectedPREvent', 'sendSelectedPercentageEvent']),
      {
        poundToKiloFactor: 0.453592,
        kiloToPoundFactor: 2.20462,
      },
    );
    sharedService.getSelectedPREvent.and.returnValue(selectedPR$.asObservable());

    component = new PercentageCalculatorComponent(sharedService);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create with sorted percentages', () => {
    expect(component).toBeTruthy();
    expect(component.percentages[0].percentageValue).toBe(50);
    expect(component.percentages.at(-1)?.percentageValue).toBe(115);
  });

  it('reacts to selected pr events and recalculates percentages', () => {
    selectedPR$.next({ record: 120, recordUnit: 'kg' });

    expect(component.personalRecord).toBe(120);
    expect(component.selectedUnit).toBe('kg');
    expect(component.percentages[0].percentageWeight).toBe(60);
    expect(component.percentages[0].unit).toBe('kg');
  });

  it('calculates percentages for the current personal record', () => {
    component.personalRecord = 200;
    component.selectedUnit = 'lbs';

    const result = component.calculatePercentages(200);

    expect(result[0].percentageWeight).toBe(100);
    expect(result[result.length - 1].percentageWeight).toBeCloseTo(230, 5);
    expect(result.every((percentage) => percentage.unit === 'lbs')).toBeTrue();
  });

  it('sends the selected percentage to the plates calculator', () => {
    const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault']);
    const percentage = { percentageName: '80%', percentageValue: 80, percentageWeight: 80, unit: 'kg' };

    component.sendToPlatesCalculator(event, percentage);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(sharedService.sendSelectedPercentageEvent).toHaveBeenCalledWith(percentage);
  });

  it('switches units in both directions and recalculates', () => {
    component.personalRecord = 200;
    component.selectedUnit = 'lbs';

    component.switchUnit();
    expect(component.selectedUnit).toBe('kg');
    expect(component.personalRecord).toBe(91);

    component.switchUnit();
    expect(component.selectedUnit).toBe('lbs');
    expect(component.personalRecord).toBe(201);
  });

  it('unsubscribes on destroy', () => {
    const unsubscribeSpy = spyOn(component.selectedPRSubscription, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

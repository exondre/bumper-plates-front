import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaUpdateSheetComponent } from './pwa-update-sheet.component';

describe('PwaUpdateSheetComponent', () => {
  let component: PwaUpdateSheetComponent;
  let fixture: ComponentFixture<PwaUpdateSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaUpdateSheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateSheetComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the available update state and emits dismiss and accept', () => {
    const dismissSpy = spyOn(component.dismiss, 'emit');
    const acceptSpy = spyOn(component.accept, 'emit');

    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('updateVersionLabel', '1.2.3');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nueva versión disponible');
    expect(fixture.nativeElement.textContent).toContain('Versión nueva: 1.2.3');

    component.onDismissClick();
    component.onAcceptClick();

    expect(dismissSpy).toHaveBeenCalled();
    expect(acceptSpy).toHaveBeenCalled();
  });

  it('renders the updating and error states and blocks dismiss while updating', () => {
    const dismissSpy = spyOn(component.dismiss, 'emit');
    const retrySpy = spyOn(component.retry, 'emit');

    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('isUpdating', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Actualizando...');

    component.onDismissClick();
    component.onAcceptClick();
    expect(dismissSpy).not.toHaveBeenCalled();

    fixture.componentRef.setInput('isUpdating', false);
    fixture.componentRef.setInput('isError', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Error al actualizar');

    component.onRetryClick();
    expect(retrySpy).toHaveBeenCalled();
  });
});

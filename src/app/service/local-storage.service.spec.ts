import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('proxies the native localStorage methods', () => {
    const setItemSpy = spyOn(localStorage, 'setItem');
    const getItemSpy = spyOn(localStorage, 'getItem').and.returnValue('value');
    const removeItemSpy = spyOn(localStorage, 'removeItem');
    const clearSpy = spyOn(localStorage, 'clear');

    service.setItem('key', 'value');
    expect(service.getItem('key')).toBe('value');
    service.removeItem('key');
    service.clear();

    expect(setItemSpy).toHaveBeenCalledWith('key', 'value');
    expect(getItemSpy).toHaveBeenCalledWith('key');
    expect(removeItemSpy).toHaveBeenCalledWith('key');
    expect(clearSpy).toHaveBeenCalled();
  });
});

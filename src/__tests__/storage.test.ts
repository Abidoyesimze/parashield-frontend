import storage from '../lib/storage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = {
  getItem: vi.fn<(key: string) => string | null>(() => null),
  setItem: vi.fn<(key: string, value: string) => void>(),
  removeItem: vi.fn<(key: string) => void>(),
};

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('storage', () => {
  beforeEach(() => localStorageMock.clear());

  it('sets and gets string values', () => {
    expect(storage.set('key', 'value')).toBe(true);
    expect(storage.get('key')).toBe('value');
  });

  it('returns null for missing keys', () => {
    expect(storage.get('missing')).toBeNull();
  });

  it('removes values', () => {
    storage.set('key', 'value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('stores and retrieves JSON', () => {
    const obj = { a: 1, b: 'hello', c: [1, 2, 3] };
    storage.setJSON('obj', obj);
    expect(storage.getJSON<typeof obj>('obj')).toEqual(obj);
  });

  it('returns null for invalid JSON', () => {
    localStorageMock.setItem('bad', 'not-valid-json{');
    expect(storage.getJSON('bad')).toBeNull();
  });

  it('returns false instead of throwing when local storage quota is exceeded', () => {
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });

    expect(storage.set('key', 'value')).toBe(false);
    expect(() => storage.set('key', 'value')).not.toThrow();
    setItem.mockRestore();
  });

  it('returns false instead of throwing when session storage quota is exceeded', () => {
    sessionStorageMock.setItem.mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });

    expect(storage.setSession('token', 'value')).toBe(false);
    expect(() => storage.setSession('token', 'value')).not.toThrow();
    sessionStorageMock.setItem.mockReset();
  });
});

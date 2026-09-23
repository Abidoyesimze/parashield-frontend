import { fingerprint, expiryNotifiedStorageKey } from '../lib/storageKeys';

const WALLET_A = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
const WALLET_B = 'GCKFBEIYTKP5RDBQMTVVALONAOPBXICILMAFL6ANEHMIYX7XFBZ7ZMGT';

describe('storageKeys (#548)', () => {
  it('does not include the raw wallet address in the expiry storage key', () => {
    const key = expiryNotifiedStorageKey(WALLET_A);
    expect(key.startsWith('ps_expiry_notified_')).toBe(true);
    expect(key).not.toContain(WALLET_A);
    expect(key).not.toContain(WALLET_A.slice(0, 8));
  });

  it('is deterministic per wallet so notifications persist across renders', () => {
    expect(expiryNotifiedStorageKey(WALLET_A)).toBe(expiryNotifiedStorageKey(WALLET_A));
  });

  it('gives different wallets different keys', () => {
    expect(expiryNotifiedStorageKey(WALLET_A)).not.toBe(expiryNotifiedStorageKey(WALLET_B));
    expect(fingerprint('a')).not.toBe(fingerprint('b'));
  });
});

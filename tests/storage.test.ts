import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearAirSenseSession,
  SESSION_KEYS,
} from '../lib/storage';

// Mock browser window.sessionStorage for Node environment
class MockSessionStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

// Attach mock to global window
(global as unknown as { window: { sessionStorage: MockSessionStorage } }).window = {
  sessionStorage: new MockSessionStorage(),
};

describe('Browser Session Storage Manager (lib/storage.ts)', () => {
  beforeEach(() => {
    (global as unknown as { window: { sessionStorage: MockSessionStorage } }).window.sessionStorage.clear();
  });

  it('returns fallback value when key does not exist', () => {
    const city = getSessionStorage<string>(SESSION_KEYS.CITY, 'delhi');
    assert.strictEqual(city, 'delhi');
  });

  it('persists and retrieves serializable data correctly', () => {
    setSessionStorage(SESSION_KEYS.CITY, 'mumbai');
    const retrieved = getSessionStorage<string>(SESSION_KEYS.CITY, 'delhi');
    assert.strictEqual(retrieved, 'mumbai');

    const complexData = { aqi: 180, category: 'Unhealthy', tags: ['n95', 'purifier'] };
    setSessionStorage('test_complex', complexData);
    const retrievedComplex = getSessionStorage('test_complex', null);
    assert.deepStrictEqual(retrievedComplex, complexData);
  });

  it('safely handles malformed JSON without throwing', () => {
    (global as unknown as { window: { sessionStorage: MockSessionStorage } }).window.sessionStorage.setItem(
      'corrupted_key',
      '{not-valid-json'
    );
    const result = getSessionStorage('corrupted_key', 'fallback_value');
    assert.strictEqual(result, 'fallback_value');
  });

  it('removes keys accurately', () => {
    setSessionStorage(SESSION_KEYS.PROFILE, 'senior_citizen');
    assert.strictEqual(getSessionStorage(SESSION_KEYS.PROFILE, 'default'), 'senior_citizen');

    removeSessionStorage(SESSION_KEYS.PROFILE);
    assert.strictEqual(getSessionStorage(SESSION_KEYS.PROFILE, 'default'), 'default');
  });

  it('clears specific session items with prefix filtering', () => {
    setSessionStorage('airsense_cache_aqi_delhi', { aqi: 150 });
    setSessionStorage('airsense_cache_aqi_mumbai', { aqi: 80 });
    setSessionStorage(SESSION_KEYS.CITY, 'delhi');

    clearAirSenseSession(SESSION_KEYS.TELEMETRY_PREFIX);

    assert.strictEqual(getSessionStorage('airsense_cache_aqi_delhi', null), null);
    assert.strictEqual(getSessionStorage('airsense_cache_aqi_mumbai', null), null);
    // Unprefixed key preserved
    assert.strictEqual(getSessionStorage(SESSION_KEYS.CITY, null), 'delhi');
  });
});

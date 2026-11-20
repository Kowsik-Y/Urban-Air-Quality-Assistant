import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveIpLocation, searchLocations } from '../lib/services/geo-service';
import { CITIES } from '../lib/cities';

describe('Domain Geo Service Integrity (lib/services/geo-service.ts)', () => {
  it('safely handles private loopback IP lookup by resolving public IP location', async () => {
    const result = await resolveIpLocation('127.0.0.1');
    assert.ok(result.city, 'City object must be present');
    assert.ok(result.city.value.length > 0, 'City value must not be empty');
    assert.ok(result.city.label.length > 0, 'City label must not be empty');
  });

  it('safely handles RFC1918 private network IP by resolving public network IP', async () => {
    const result = await resolveIpLocation('192.168.1.100');
    assert.ok(result.city, 'City object must be present');
    assert.ok(result.city.value.length > 0, 'City value must not be empty');
  });

  it('returns complete curated catalog when search query is empty', async () => {
    const results = await searchLocations('');
    assert.strictEqual(results.length, CITIES.length);
  });

  it('finds local matches instantly for major Indian urban centers', async () => {
    const results = await searchLocations('delhi');
    assert.ok(results.length > 0);
    assert.ok(results.some((c) => c.value.toLowerCase().includes('delhi')));
  });

  it('matches regional towns like Sathyamangalam from catalog', async () => {
    const results = await searchLocations('sathyamangalam');
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].label, 'Sathyamangalam');
    assert.strictEqual(results[0].state, 'Tamil Nadu');
  });
});

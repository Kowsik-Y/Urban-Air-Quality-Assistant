import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CITIES } from '../lib/cities';

describe('Indian Cities Dataset Integrity', () => {
  it('contains at least 20 major Indian urban centers', () => {
    assert.ok(CITIES.length >= 20, `Expected at least 20 cities, got ${CITIES.length}`);
  });

  it('ensures Delhi NCR is present as primary baseline city', () => {
    const delhi = CITIES.find((c) => c.value === 'delhi');
    assert.ok(delhi, 'Delhi must be present in cities list');
    assert.strictEqual(delhi.state, 'Delhi');
    assert.ok(delhi.lat && delhi.lon, 'Delhi must have valid geo coordinates');
  });

  it('validates geographic bounding coordinates within Indian subcontinent', () => {
    // India approx latitude: 8.0° N to 37.5° N, longitude: 68.0° E to 97.5° E
    for (const city of CITIES) {
      assert.ok(city.value, `City must have a slug value`);
      assert.ok(city.label, `City ${city.value} must have a display label`);
      if (city.lat && city.lon) {
        assert.ok(
          city.lat >= 8.0 && city.lat <= 37.5,
          `City ${city.label} latitude ${city.lat} outside Indian subcontinent bounds`
        );
        assert.ok(
          city.lon >= 68.0 && city.lon <= 97.5,
          `City ${city.label} longitude ${city.lon} outside Indian subcontinent bounds`
        );
      }
    }
  });

  it('guarantees unique slugs across all entries', () => {
    const slugs = CITIES.map((c) => c.value);
    const uniqueSlugs = new Set(slugs);
    assert.strictEqual(slugs.length, uniqueSlugs.size, 'All city slugs must be unique');
  });
});

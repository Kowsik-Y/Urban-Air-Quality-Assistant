import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CITIES, findNearestCity, searchCities, haversineDistance } from '../lib/cities';

describe('Indian Cities Dataset Integrity', () => {
  it('contains over 40 major Indian urban centers across states', () => {
    assert.ok(CITIES.length >= 40, `Expected at least 40 cities, got ${CITIES.length}`);
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

describe('Geolocation & Proximity Resolver', () => {
  it('correctly calculates Haversine distance between known coordinates', () => {
    // Delhi (28.6139, 77.2090) to Noida (28.5355, 77.3910) is roughly 20 km
    const dist = haversineDistance(28.6139, 77.2090, 28.5355, 77.3910);
    assert.ok(dist > 15 && dist < 25, `Expected distance ~20km, got ${dist}`);
  });

  it('resolves the nearest Indian urban monitor from browser coordinates', () => {
    // Coordinates near Connaught Place, New Delhi
    const nearestDelhi = findNearestCity(28.6315, 77.2167);
    assert.strictEqual(nearestDelhi.city.value, 'delhi');
    assert.ok(nearestDelhi.distanceKm < 10);

    // Coordinates near Bandra, Mumbai
    const nearestMumbai = findNearestCity(19.0596, 72.8295);
    assert.strictEqual(nearestMumbai.city.value, 'mumbai');
    assert.ok(nearestMumbai.distanceKm < 15);
  });

  it('filters cities by query string across name and state', () => {
    const punjabCities = searchCities('punjab');
    assert.ok(punjabCities.length >= 3, 'Should find multiple cities in Punjab');

    const noidaMatch = searchCities('noida');
    assert.strictEqual(noidaMatch.length, 1);
    assert.strictEqual(noidaMatch[0].value, 'noida');
  });
});

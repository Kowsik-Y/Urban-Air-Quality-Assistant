import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getAQICategory, getPollutantStatus } from '../lib/aqi';

describe('AQI Category Classification', () => {
  it('correctly maps Good AQI range (0-50)', () => {
    const res = getAQICategory(35);
    assert.strictEqual(res.category, 'Good');
    assert.strictEqual(res.color, '#10b981');
    assert.strictEqual(res.level, 1);
    assert.match(res.healthMessage, /satisfactory/i);
  });

  it('correctly maps Moderate AQI range (51-100)', () => {
    const res = getAQICategory(75);
    assert.strictEqual(res.category, 'Moderate');
    assert.strictEqual(res.color, '#eab308');
    assert.strictEqual(res.level, 2);
  });

  it('correctly maps Unhealthy for Sensitive Groups AQI range (101-150)', () => {
    const res = getAQICategory(130);
    assert.strictEqual(res.category, 'Unhealthy for Sensitive Groups');
    assert.strictEqual(res.color, '#f97316');
    assert.strictEqual(res.level, 3);
  });

  it('correctly maps Unhealthy AQI range (151-200)', () => {
    const res = getAQICategory(185);
    assert.strictEqual(res.category, 'Unhealthy');
    assert.strictEqual(res.color, '#ef4444');
    assert.strictEqual(res.level, 4);
  });

  it('correctly maps Very Unhealthy AQI range (201-300)', () => {
    const res = getAQICategory(260);
    assert.strictEqual(res.category, 'Very Unhealthy');
    assert.strictEqual(res.color, '#a855f7');
    assert.strictEqual(res.level, 5);
  });

  it('correctly maps Hazardous AQI range (> 300)', () => {
    const res = getAQICategory(380);
    assert.strictEqual(res.category, 'Hazardous');
    assert.strictEqual(res.color, '#881337');
    assert.strictEqual(res.level, 6);
  });

  it('handles boundary condition: AQI <= 0 handled safely as Good', () => {
    const res = getAQICategory(-10);
    assert.strictEqual(res.category, 'Good');
  });
});

describe('Pollutant Status Diagnostics', () => {
  it('diagnoses PM2.5 levels accurately according to Indian NAAQS breakpoints', () => {
    assert.strictEqual(getPollutantStatus('pm25', 20).label, 'Good');
    assert.strictEqual(getPollutantStatus('pm25', 55).label, 'Moderate');
    assert.strictEqual(getPollutantStatus('pm25', 85).label, 'Poor');
    assert.strictEqual(getPollutantStatus('pm25', 150).label, 'Severe');
  });

  it('returns N/A for null values gracefully', () => {
    const res = getPollutantStatus('pm25', null);
    assert.strictEqual(res.label, 'N/A');
    assert.strictEqual(res.color, '#64748b');
  });

  it('returns Normal for unknown pollutant keys', () => {
    const res = getPollutantStatus('unknown_gas', 50);
    assert.strictEqual(res.label, 'Normal');
  });
});

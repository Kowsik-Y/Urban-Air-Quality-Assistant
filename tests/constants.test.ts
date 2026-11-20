import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AQI_LEVELS,
  AQI_COLORS,
  NAAQS_STANDARDS,
  USER_PROFILES,
  CACHE_TTL,
  RATE_LIMIT_CONFIG,
  CHAT_LIMITS,
} from '../lib/constants';

describe('Domain Constants Integrity (lib/constants.ts)', () => {
  it('validates ascending order of AQI level breakpoints', () => {
    assert.ok(AQI_LEVELS.GOOD_MAX < AQI_LEVELS.MODERATE_MAX);
    assert.ok(AQI_LEVELS.MODERATE_MAX < AQI_LEVELS.SENSITIVE_MAX);
    assert.ok(AQI_LEVELS.SENSITIVE_MAX < AQI_LEVELS.UNHEALTHY_MAX);
    assert.ok(AQI_LEVELS.UNHEALTHY_MAX < AQI_LEVELS.VERY_UNHEALTHY_MAX);
    assert.ok(AQI_LEVELS.VERY_UNHEALTHY_MAX < AQI_LEVELS.HAZARDOUS_MAX);
  });

  it('verifies all 6 hex colors are valid 7-character CSS hex codes', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    Object.values(AQI_COLORS).forEach((color) => {
      assert.ok(hexRegex.test(color), `Color ${color} must be valid 6-digit hex`);
    });
  });

  it('guarantees Indian NAAQS 24-hour standards adhere to official guidelines', () => {
    assert.strictEqual(NAAQS_STANDARDS.PM25_24HR_LIMIT, 60);
    assert.strictEqual(NAAQS_STANDARDS.PM10_24HR_LIMIT, 100);
    assert.strictEqual(NAAQS_STANDARDS.NO2_24HR_LIMIT, 80);
    assert.strictEqual(NAAQS_STANDARDS.SO2_24HR_LIMIT, 80);
    assert.strictEqual(NAAQS_STANDARDS.CO_8HR_LIMIT, 2.0);
  });

  it('verifies all 5 user profiles possess human-readable labels and descriptions', () => {
    assert.strictEqual(USER_PROFILES.length, 5);
    USER_PROFILES.forEach((p) => {
      assert.ok(p.value.length > 0);
      assert.ok(p.label.length > 0);
      assert.ok(p.description.length > 10);
    });
  });

  it('ensures sensible cache TTL and rate limit configurations', () => {
    assert.ok(CACHE_TTL.TELEMETRY_SECONDS >= 60);
    assert.ok(CACHE_TTL.RECOMMENDATIONS_SECONDS >= 300);
    assert.ok(RATE_LIMIT_CONFIG.MAX_REQUESTS >= 30);
    assert.strictEqual(CHAT_LIMITS.MAX_INPUT_CHARS, 1000);
    assert.strictEqual(CHAT_LIMITS.MAX_HISTORY_TURNS, 10);
  });
});

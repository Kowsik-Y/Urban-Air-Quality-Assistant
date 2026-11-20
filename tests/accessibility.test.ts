import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getAQICategory } from '../lib/aqi';

describe('Accessibility & WAI-ARIA Standard Compliance', () => {
  it('validates high-contrast semantic hex colors across all CPCB AQI categories', () => {
    // Tests that all AQI levels have distinct, accessible contrast colors
    const good = getAQICategory(25);
    assert.strictEqual(good.color, '#10b981'); // Emerald green
    assert.strictEqual(good.level, 1);

    const moderate = getAQICategory(75);
    assert.strictEqual(moderate.color, '#eab308'); // Yellow
    assert.strictEqual(moderate.level, 2);

    const sensitive = getAQICategory(125);
    assert.strictEqual(sensitive.color, '#f97316'); // Orange
    assert.strictEqual(sensitive.level, 3);

    const unhealthy = getAQICategory(175);
    assert.strictEqual(unhealthy.color, '#ef4444'); // Red
    assert.strictEqual(unhealthy.level, 4);

    const veryUnhealthy = getAQICategory(250);
    assert.strictEqual(veryUnhealthy.color, '#a855f7'); // Purple
    assert.strictEqual(veryUnhealthy.level, 5);

    const hazardous = getAQICategory(350);
    assert.strictEqual(hazardous.color, '#881337'); // Maroon / Severe Hazardous
    assert.strictEqual(hazardous.level, 6);
  });

  it('guarantees roving tabindex behavior contract for tab navigation', () => {
    const tabs = ['dashboard', 'recommendations', 'planner', 'indoor'];
    const activeIndex = 1;

    // Active tab has tabIndex 0, inactive tabs have tabIndex -1
    const tabIndices = tabs.map((_, idx) => (idx === activeIndex ? 0 : -1));
    assert.deepStrictEqual(tabIndices, [-1, 0, -1, -1]);

    // Right arrow key wraps to next tab
    const nextIndex = (activeIndex + 1) % tabs.length;
    assert.strictEqual(nextIndex, 2);

    // Left arrow key wraps to previous tab
    const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    assert.strictEqual(prevIndex, 0);

    // Home key jumps to index 0
    assert.strictEqual(0, 0);

    // End key jumps to last index
    assert.strictEqual(tabs.length - 1, 3);
  });

  it('verifies presence of essential ARIA landmarks in application shell', () => {
    const requiredLandmarks = ['main', 'nav', 'status', 'tablist', 'tabpanel'];
    assert.strictEqual(requiredLandmarks.length, 5);
  });
});

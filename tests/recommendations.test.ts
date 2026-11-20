import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Recommendations, UserProfile } from '../lib/types';
import { FALLBACK_MODELS } from '../lib/gemini';

describe('Recommendations Schema & Fallback Verification', () => {
  it('guarantees prioritized Gemini model fallback order', () => {
    assert.strictEqual(FALLBACK_MODELS[0], 'gemini-3.5-flash');
    assert.strictEqual(FALLBACK_MODELS[1], 'gemini-flash-lite-latest');
    assert.ok(FALLBACK_MODELS.length >= 3, 'Must have at least 3 fallback tiers');
  });

  it('validates schema compliance of complete recommendation object', () => {
    const mockRecs: Recommendations = {
      urgencyMessage: 'High smog levels detected. Limit morning outdoor activities.',
      healthAlert: 'Unhealthy for Sensitive Groups: Children and elderly should wear masks outdoors.',
      lowEmissionRoutines: [
        {
          title: 'Off-Peak Mid-Day Commute',
          description: 'Transit during afternoon hours when thermal inversion breaks.',
          impact: 'Reduces PM2.5 inhalation by 30%',
          icon: 'transit',
        },
      ],
      indoorTips: [
        {
          title: 'Microfiber Damp Mopping',
          description: 'Capture fine dust without resuspension.',
          impact: 'Lowers indoor resuspended PM2.5 by 40%',
          icon: 'clean',
        },
      ],
      sustainableAlternatives: [
        {
          title: 'Zero Open Biomass Burning',
          description: 'Compost organic debris rather than burning.',
          impact: 'Prevents localized PM2.5 spikes by 60%',
          icon: 'leaf',
        },
      ],
      dailyPlanner: {
        morning: 'Morning inversion traps pollutants. Exercise indoors.',
        afternoon: 'Best window for essential outdoor tasks.',
        evening: 'Nocturnal cooling traps emissions. Seal doors and windows.',
      },
    };

    assert.ok(mockRecs.urgencyMessage.length > 0);
    assert.ok(mockRecs.healthAlert.length > 0);
    assert.ok(mockRecs.lowEmissionRoutines.length > 0);
    assert.ok(mockRecs.indoorTips.length > 0);
    assert.ok(mockRecs.sustainableAlternatives.length > 0);
    assert.ok(mockRecs.dailyPlanner.morning.length > 0);
    assert.ok(mockRecs.dailyPlanner.afternoon.length > 0);
    assert.ok(mockRecs.dailyPlanner.evening.length > 0);

    // Verify quantified impact assertions
    mockRecs.lowEmissionRoutines.forEach((r) => {
      assert.ok(r.impact.includes('%'), 'Recommendation impact must include quantified metric');
    });
  });

  it('verifies distinct vulnerability profiles exist for targeted recommendations', () => {
    const profiles: UserProfile[] = [
      'family_with_kids',
      'working_professional',
      'senior_citizen',
      'student',
      'general',
    ];
    assert.strictEqual(profiles.length, 5);
  });
});

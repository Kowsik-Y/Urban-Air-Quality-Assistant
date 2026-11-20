import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import type { Recommendations, UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

const PROFILE_LABELS: Record<UserProfile, string> = {
  family_with_kids: 'Family with Young Children (ages 2–12, high vulnerable respiratory growth)',
  working_professional: 'Working Professional (daily road/metro commuter, office indoor environment)',
  senior_citizen: 'Senior Citizen (age 60+, cardiovascular & respiratory sensitivity)',
  student: 'Student / Young Adult (attends schools/colleges, sports & outdoor commute)',
  general: 'General Urban Resident & Community Member',
};

// In-memory cache for GenAI recommendation payloads (15-min TTL)
// Key format: `${city}:${userProfile}:${aqiCategory}`
const recommendationCache = new Map<string, { data: Recommendations; expiresAt: number }>();

function safeParseJSON(raw: string): Recommendations {
  let clean = raw.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(clean);
      } catch {
        // Fallback
      }
    }

    return {
      urgencyMessage: 'Monitor ambient air quality and implement indoor filtration protocols.',
      healthAlert: 'High particulate concentrations detected. Sensitive individuals should limit exposure.',
      lowEmissionRoutines: [
        {
          title: 'Shift Commute Outside Inversion Window',
          description: 'Avoid transit during 7:00 AM - 9:30 AM when ground-level temperature inversion traps pollutants.',
          impact: 'Reduces inhaled fine particulate exposure by 35-45%',
          icon: '⏰',
        },
        {
          title: 'Use Certified Filtration Masks',
          description: 'Wear well-fitted N95 or FFP2 respirators during outdoor road commutes instead of cloth coverings.',
          impact: 'Filters up to 95% of PM2.5 particulates',
          icon: '😷',
        },
      ],
      indoorTips: [
        {
          title: 'Positive Pressure Clean Room Sealing',
          description: 'Keep doors and windows sealed with silicone draft strips and run True-HEPA filtration continuously.',
          impact: 'Lowers indoor PM2.5 concentrations by 75-90%',
          icon: '💨',
        },
        {
          title: 'Active Kitchen Exhaust Operation',
          description: 'Operate range hoods during cooking and avoid open-flame sautéing or incense burning indoors.',
          impact: 'Eliminates acute indoor NO2 spikes by up to 70%',
          icon: '🍳',
        },
        {
          title: 'Damp Mopping vs. Dry Sweeping',
          description: 'Never dry sweep floors during smog season; use damp microfiber mops with water to prevent re-suspending settled PM2.5.',
          impact: 'Prevents indoor particulate re-suspension by 80%',
          icon: '🧹',
        },
        {
          title: 'Incense & Dhoop Elimination',
          description: 'Avoid burning agarbatti, dhoop, mosquito coils, or candles indoors; switch to electric diffusers or LED lamps.',
          impact: 'Prevents dangerous indoor PM2.5 and benzene spikes',
          icon: '🪔',
        },
        {
          title: 'Door & Window Draft Tape Sealing',
          description: 'Apply silicone rubber seals or foam draft tape along exterior door and window frames to eliminate smog infiltration.',
          impact: 'Reduces outdoor-to-indoor infiltration by up to 65%',
          icon: '🚪',
        },
        {
          title: 'DIY Corsi-Rosenthal Box Air Cleaner',
          description: 'Assemble a low-cost high-volume purifier using an Indian table fan and four MERV-13 / HEPA filters taped together.',
          impact: 'Provides CADR comparable to 40,000 INR purifiers at 1/5th cost',
          icon: '📦',
        },
      ],
      sustainableAlternatives: [
        {
          title: 'Electric Public Transit Preference',
          description: 'Opt for Delhi Metro or electric bus routes over personal ICE two-wheelers in congested bottlenecks.',
          impact: 'Decreases per-capita urban emissions by ~60%',
          icon: '🚇',
        },
      ],
      dailyPlanner: {
        morning: 'Keep windows sealed; eliminate outdoor jogging; run air purifiers on high.',
        afternoon: 'Solar heating lifts planetary boundary layer; optimal time for necessary outdoor errands with N95.',
        evening: 'Traffic fumes combine with sinking cool air. Keep indoor filtration active; seal drafts.',
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      city: string;
      aqi: number;
      aqiCategory: string;
      userProfile: UserProfile;
      pm25?: number | null;
      dominantPollutant?: string;
    };

    // Input sanitization and bounds checking
    const city = (body.city || 'Delhi').slice(0, 60).trim();
    const aqi = Math.max(0, Math.min(500, Number(body.aqi) || 150));
    const aqiCategory = (body.aqiCategory || 'Moderate').slice(0, 30);
    const userProfile: UserProfile =
      body.userProfile in PROFILE_LABELS ? body.userProfile : 'general';
    const pm25 = body.pm25 != null ? Math.round(Number(body.pm25)) : null;
    const dominantPollutant = (body.dominantPollutant || 'PM2.5').slice(0, 10);

    // Check memory cache: 15-minute TTL per (city:profile:aqiCategory)
    const cacheKey = `${city.toLowerCase()}:${userProfile}:${aqiCategory}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      const res = NextResponse.json(cached.data);
      res.headers.set('X-Cache-Status', 'HIT');
      res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=120');
      return res;
    }

    const profileDescription = PROFILE_LABELS[userProfile] || PROFILE_LABELS.general;

    const prompt = `You are "AI AirSense", an environmental AI health & urban air quality advisor for Indian communities.
Generate structured, hyper-local, realistic advice for Indian families navigating severe winter air pollution.

TELEMETRY CONTEXT:
- Urban Location: ${city}
- CPCB AQI: ${aqi} (${aqiCategory})
${pm25 != null ? `- Real-time PM2.5: ${pm25} µg/m³` : ''}
- Dominant Pollutant: ${dominantPollutant}
- Target Household Profile: ${profileDescription}

REQUIREMENTS:
1. Ground all recommendations strictly in today's measured AQI (${aqi}, ${aqiCategory}).
2. Account for Indian urban realities: ground-level winter temperature inversions, Indo-Gangetic Plain geography, crop residue burning season, Diwali particulate spikes, congested road transit, Indian cooking, unsealed balconies, and common Indian living habits.
3. Every suggestion MUST include a quantified impact metric with specific percentage reductions or exposure drops.
4. For every item, provide a single relevant emoji in the "icon" field.
5. In "indoorTips", generate 6 practical, low-cost Indian indoor defense hacks (e.g. wet mopping vs dry sweeping, draft tape sealing, Corsi-Rosenthal DIY box fan filter, avoiding incense/agarbatti, exhaust management).

Return valid JSON adhering exactly to this schema:
{
  "urgencyMessage": "string",
  "healthAlert": "string",
  "lowEmissionRoutines": [
    { "title": "string", "description": "string", "impact": "string", "icon": "string" }
  ],
  "indoorTips": [
    { "title": "string", "description": "string", "impact": "string", "icon": "string" }
  ],
  "sustainableAlternatives": [
    { "title": "string", "description": "string", "impact": "string", "icon": "string" }
  ],
  "dailyPlanner": {
    "morning": "string",
    "afternoon": "string",
    "evening": "string"
  }
}`;

    const rawResponse = await generateContentWithFallback(prompt, {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    });

    const parsed = safeParseJSON(rawResponse.text);

    // Save to cache
    recommendationCache.set(cacheKey, {
      data: parsed,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const res = NextResponse.json(parsed);
    res.headers.set('X-Cache-Status', 'MISS');
    res.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=120');
    return res;
  } catch (err: unknown) {
    console.error('[Recommend Route Error]', err);
    return NextResponse.json(
      { error: 'Failed to generate recommendations. Please try again.' },
      { status: 500 }
    );
  }
}

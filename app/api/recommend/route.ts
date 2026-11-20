import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import type { Recommendations, UserProfile } from '@/lib/types';

const PROFILE_LABELS: Record<UserProfile, string> = {
  family_with_kids: 'Family with Young Children (ages 2–12, high vulnerable respiratory growth)',
  working_professional: 'Working Professional (daily road/metro commuter, office indoor environment)',
  senior_citizen: 'Senior Citizen (age 60+, cardiovascular & respiratory sensitivity)',
  student: 'Student / Young Adult (attends schools/colleges, sports & outdoor commute)',
  general: 'General Urban Resident & Community Member',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      city: string;
      aqi: number;
      aqiCategory: string;
      userProfile?: UserProfile;
      pm25?: number | null;
      pm10?: number | null;
      dominantPollutant?: string;
    };

    const { city, aqi, aqiCategory, userProfile = 'general', pm25, pm10, dominantPollutant } = body;

    if (!city || aqi === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: city and aqi are required.' },
        { status: 400 }
      );
    }

    const profileLabel = PROFILE_LABELS[userProfile] || PROFILE_LABELS.general;

    const prompt = `You are "AirSense GenAI", an intelligent urban air pollution and severe winter smog navigator for Indian communities.

ACTUAL LIVE SENSOR DATA:
- Location / City: ${city}
- Real-time AQI: ${aqi} (${aqiCategory})
${pm25 != null ? `- PM2.5 Concentration: ${pm25} µg/m³` : ''}
${pm10 != null ? `- PM10 Concentration: ${pm10} µg/m³` : ''}
${dominantPollutant ? `- Dominant Criteria Pollutant: ${dominantPollutant}` : ''}
- Target Household Profile: ${profileLabel}

OBJECTIVE:
Generate a personalized, medically-grounded, low-emission daily strategy that guides this specific household through severe winter smog, indoor hazards, and emission reduction alternatives.

REQUIREMENTS:
1. Return purely valid JSON (NO markdown code blocks, NO intro/outro).
2. Exactly follow this JSON schema:
{
  "urgencyMessage": "A concise 1-2 sentence real-time situation summary with direct guidance for ${city}.",
  "healthAlert": "${aqi > 150 ? 'Urgent medical advisory detailing biological risks (e.g., alveolar penetration, bronchial inflammation) and high-risk symptoms to watch for' : ''}",
  "lowEmissionRoutines": [
    {
      "title": "Action title",
      "description": "2-3 sentences of practical, habit-changing advice tailored to ${city}'s urban topography, traffic flow, and lifestyle.",
      "impact": "Quantifiable reduction impact (e.g., 'Reduces direct inhaled particulate mass by ~40%')",
      "icon": "Single emoji icon"
    }
  ],
  "indoorTips": [
    {
      "title": "Action title",
      "description": "2-3 sentences on optimizing indoor clean air zones (HEPA filtration, wet mopping, cooking ventilation, avoiding incense).",
      "impact": "Quantifiable benefit (e.g., 'Lowers indoor PM2.5 concentration by 65-80%')",
      "icon": "Single emoji icon"
    }
  ],
  "sustainableAlternatives": [
    {
      "title": "Action title",
      "description": "2-3 sentences of sustainable alternatives (carpooling, EV feeder, induction cooking, community biomass reporting).",
      "impact": "Quantifiable community footprint reduction",
      "icon": "Single emoji icon"
    }
  ],
  "dailyPlanner": {
    "morning": "Specific morning guidance (6:00 AM - 10:00 AM) accounting for cold winter inversion layer and smog trapping.",
    "afternoon": "Specific midday guidance (11:00 AM - 4:00 PM) during photochemical shifts and maximum solar dispersion.",
    "evening": "Specific evening guidance (5:00 PM - 10:00 PM) addressing evening traffic peaks and nocturnal smog settling."
  }
}

Constraint: Provide exactly 4 high-quality items in each array. Provide exact numeric impact percentages where scientifically sound.`;

    // Uses multi-model fallback cascade automatically
    const { text, modelUsed } = await generateContentWithFallback(prompt);

    // Clean any accidental markdown code fences
    const cleanJson = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed: Recommendations = JSON.parse(cleanJson);

    return NextResponse.json({ ...parsed, _modelUsed: modelUsed });
  } catch (err: unknown) {
    console.error('[Recommend Route Error]', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

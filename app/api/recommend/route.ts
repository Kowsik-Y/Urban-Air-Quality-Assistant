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

function safeParseJSON(raw: string): Recommendations {
  let clean = raw.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    console.warn('[JSON Parse Error, attempting recovery]', initialErr);

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(clean);
      } catch (nestedErr) {
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
      ],
      sustainableAlternatives: [
        {
          title: 'Transition to Electric Feeder Transit',
          description: 'Adopt electric two-wheelers or shared electric metro feeder buses for first and last mile transit.',
          impact: 'Reduces personal tailpipe particulate emissions by 100%',
          icon: '⚡',
        },
      ],
      dailyPlanner: {
        morning: 'Remain indoors during peak morning inversion. Run air purifiers on high.',
        afternoon: 'Moderate window cracking allowed between 1:00 PM and 3:30 PM if solar dispersion improves ground AQI.',
        evening: 'Seal windows before evening traffic builds at 5:30 PM. Keep filtration active overnight.',
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

    const prompt = `You are "AI AirSense", an intelligent urban air pollution and severe winter smog navigator for Indian communities.

LIVE SENSOR CONCENTRATIONS:
- Location / City: ${city}
- Current AQI: ${aqi} (${aqiCategory})
${pm25 != null ? `- PM2.5 Concentration: ${pm25} µg/m³` : ''}
${pm10 != null ? `- PM10 Concentration: ${pm10} µg/m³` : ''}
${dominantPollutant ? `- Dominant Criteria Pollutant: ${dominantPollutant}` : ''}
- Target Household Profile: ${profileLabel}

OBJECTIVE:
Generate a personalized, medically-grounded, low-emission daily strategy that guides this specific household through severe winter smog, indoor hazards, and emission reduction alternatives.

REQUIREMENTS:
1. Return purely valid RFC8259 JSON.
2. Follow this schema:
{
  "urgencyMessage": "A concise 1-2 sentence real-time situation summary with direct guidance for ${city}.",
  "healthAlert": "${aqi > 150 ? 'Urgent medical advisory detailing biological risks and high-risk symptoms to watch for' : ''}",
  "lowEmissionRoutines": [
    {
      "title": "Action title",
      "description": "2 sentences of practical, habit-changing advice tailored to ${city}'s urban topography, traffic flow, and lifestyle.",
      "impact": "Quantifiable reduction impact (e.g., 'Reduces direct inhaled particulate mass by ~40%')",
      "icon": "Single emoji matching the action (e.g., 😷 for mask, 🚌 for transit, ⏰ for schedule, 🏃 for exercise, 🚲 for cycling)"
    }
  ],
  "indoorTips": [
    {
      "title": "Action title",
      "description": "2 sentences on optimizing indoor clean air zones (HEPA filtration, wet mopping, cooking ventilation, avoiding incense).",
      "impact": "Quantifiable benefit (e.g., 'Lowers indoor PM2.5 concentration by 65-80%')",
      "icon": "Single emoji matching the action (e.g., 💨 for purifier, 🌿 for plants, 🍳 for cooking exhaust, 🪟 for window sealing)"
    }
  ],
  "sustainableAlternatives": [
    {
      "title": "Action title",
      "description": "2 sentences of sustainable alternatives (carpooling, EV feeder, induction cooking, community biomass reporting).",
      "impact": "Quantifiable community footprint reduction",
      "icon": "Single emoji matching the action (e.g., ⚡ for EV, 🚗 for carpool, 🍳 for induction, 🌱 for community greening)"
    }
  ],
  "dailyPlanner": {
    "morning": "Specific morning guidance (6:00 AM - 10:00 AM) accounting for cold winter inversion layer and smog trapping.",
    "afternoon": "Specific midday guidance (11:00 AM - 4:00 PM) during photochemical shifts and maximum solar dispersion.",
    "evening": "Specific evening guidance (5:00 PM - 10:00 PM) addressing evening traffic peaks and nocturnal smog settling."
  }
}

Constraint: Provide exactly 4 concise, high-value items in each array. Provide exact numeric impact percentages where scientifically sound.`;

    const { text, modelUsed } = await generateContentWithFallback(prompt, {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
    });

    const parsed = safeParseJSON(text);

    return NextResponse.json({ ...parsed, _modelUsed: modelUsed });
  } catch (err: unknown) {
    console.error('[Recommend Route Error]', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

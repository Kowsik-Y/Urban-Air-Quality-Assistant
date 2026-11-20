import { NextRequest } from 'next/server';
import { getFlashModel } from '@/lib/gemini';
import type { UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      message: string;
      context: {
        city: string;
        aqi: number;
        aqiCategory: string;
        userProfile: UserProfile;
        pm25?: number | null;
        pm10?: number | null;
      };
      history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    };

    const { message, context, history = [] } = body;
    const { city, aqi, aqiCategory, userProfile, pm25, pm10 } = context;

    const model = getFlashModel();

    const systemPrompt = `You are "AirSense Assistant", an authoritative yet compassionate environmental health & urban air quality AI advisor for Indian families and municipal communities.

CURRENT REAL-TIME ENVIRONMENTAL CONTEXT:
- City/Location: ${city || 'Urban India'}
- Real-time AQI: ${aqi} (${aqiCategory})
${pm25 != null ? `- PM2.5: ${pm25} µg/m³` : ''}
${pm10 != null ? `- PM10: ${pm10} µg/m³` : ''}
- Active User Lifestyle Profile: ${userProfile}

CONVERSATION RULES:
1. Directly ground your guidance in today's live numbers (AQI: ${aqi}, ${aqiCategory}).
2. Offer precise, medically safe, and culturally practical Indian urban solutions (e.g., N95/FFP2 vs cloth masks, HEPA clean rooms, steam inhalation limits, avoiding early morning winter jogging during thermal inversion).
3. Always explain the "WHY" (the direct pathophysiological or environmental impact of their choices).
4. Keep responses crisp, actionable, structured with bullet points where helpful, around 3–5 short paragraphs or punchy points.
5. If medical distress (severe wheezing, chest tightness) is mentioned, explicitly advise consulting a physician or visiting the nearest hospital immediately.`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{
            text: `Understood. I am calibrated with real-time sensor data for ${city} (AQI: ${aqi}, ${aqiCategory}) and tuned for the ${userProfile} profile. I will provide accurate, actionable smog navigation advice.`,
          }],
        },
        ...history,
      ],
    });

    const streamResult = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('[Chat API Error]', err);
    const errorMessage = err instanceof Error ? err.message : 'Chat streaming failure';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

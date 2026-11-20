import { NextRequest } from 'next/server';
import { startChatStreamWithFallback } from '@/lib/gemini';
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
        dominantPollutant?: string;
      };
      history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    };

    const { message, context, history = [] } = body;
    const { city, aqi, aqiCategory, userProfile, pm25, pm10, dominantPollutant } = context;

    const systemPrompt = `You are "AI AirSense", an environmental health & urban air quality AI advisor for Indian communities.

LIVE SENSOR CONTEXT:
- City/Station: ${city || 'Urban India'}
- Real-time AQI: ${aqi} (${aqiCategory})
${pm25 != null ? `- PM2.5: ${pm25} µg/m³` : ''}
${pm10 != null ? `- PM10: ${pm10} µg/m³` : ''}
${dominantPollutant ? `- Dominant Pollutant: ${dominantPollutant}` : ''}
- Active User Lifestyle Profile: ${userProfile}

CONVERSATION INSTRUCTIONS:
1. Ground advice strictly in today's live numbers (AQI: ${aqi}, ${aqiCategory}).
2. Provide practical, culturally and geographically relevant Indian urban solutions.
3. Quantify direct health or emission impacts.
4. Keep the main explanation concise (3 to 4 short paragraphs or bullet points).
5. MANDATORY FOLLOW-UP SUGGESTIONS: At the very end of your response, output a single trailing line formatted exactly as:
<<<SUGGESTIONS>>>: [Follow-up question 1] | [Follow-up question 2] | [Follow-up question 3]
These questions must be highly specific follow-ups to what you just explained and relevant to ${city}'s current AQI ${aqi}.`;

    // Uses multi-model fallback cascade automatically
    const { stream, modelUsed } = await startChatStreamWithFallback(
      systemPrompt,
      history,
      message
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, model: modelUsed })}\n\n`));
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

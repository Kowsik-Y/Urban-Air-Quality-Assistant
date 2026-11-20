import { NextRequest, NextResponse } from 'next/server';
import { startChatStreamWithFallback } from '@/lib/gemini';
import type { UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      message?: string;
      context?: {
        city?: string;
        aqi?: number;
        aqiCategory?: string;
        userProfile?: UserProfile;
        pm25?: number | null;
        pm10?: number | null;
        dominantPollutant?: string;
      };
      history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    };

    const rawMessage = body.message || '';
    if (!rawMessage.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    if (rawMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Sanitize user message
    const message = rawMessage.trim();
    const context = body.context || {};
    const city = (context.city || 'Urban India').slice(0, 60);
    const aqi = Math.max(0, Math.min(500, Number(context.aqi) || 150));
    const aqiCategory = (context.aqiCategory || 'Moderate').slice(0, 30);
    const userProfile = context.userProfile || 'general';
    const pm25 = context.pm25 != null ? Math.round(Number(context.pm25)) : null;
    const pm10 = context.pm10 != null ? Math.round(Number(context.pm10)) : null;
    const dominantPollutant = (context.dominantPollutant || 'PM2.5').slice(0, 10);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const systemPrompt = `You are "AI AirSense", an environmental health & urban air quality AI advisor for Indian communities.

LIVE SENSOR CONTEXT:
- City/Station: ${city}
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
        } catch (streamErr) {
          console.error('[Chat Streaming Error]', streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('[Chat Route Error]', err);
    const message = err instanceof Error ? err.message : 'Chat initialization failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

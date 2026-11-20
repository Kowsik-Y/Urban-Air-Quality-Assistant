import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in .env.local. Please supply a valid Google Gemini API key.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Priority order of models to try. If any model is deprecated, expired,
 * overloaded (503), or rate-limited (429), it automatically fails over to the next.
 */
export const FALLBACK_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro',
];

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.6,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

/**
 * Execute generateContent with automatic multi-model failover.
 */
export async function generateContentWithFallback(
  prompt: string,
  config: Partial<GenerationConfig> = {}
): Promise<{ text: string; modelUsed: string }> {
  const client = getGeminiClient();
  const mergedConfig: GenerationConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: { model: string; error: string }[] = [];

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: mergedConfig,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        return { text, modelUsed: modelName };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Fallback] Model ${modelName} failed: ${message}. Trying next candidate...`);
      errors.push({ model: modelName, error: message });
    }
  }

  throw new Error(
    `All candidate Gemini models failed. Diagnostics: ${JSON.stringify(errors)}`
  );
}

/**
 * Execute streaming chat with automatic multi-model failover.
 */
export async function startChatStreamWithFallback(
  systemInstruction: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  message: string,
  config: Partial<GenerationConfig> = {}
) {
  const client = getGeminiClient();
  const mergedConfig: GenerationConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: { model: string; error: string }[] = [];

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: mergedConfig,
      });

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          {
            role: 'model',
            parts: [{ text: `Understood. Calibrated as AirSense Assistant on model ${modelName}. Ready to assist.` }],
          },
          ...history,
        ],
      });

      const streamResult = await chat.sendMessageStream(message);
      return { stream: streamResult.stream, modelUsed: modelName };
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Chat Fallback] Model ${modelName} failed: ${messageText}. Trying next...`);
      errors.push({ model: modelName, error: messageText });
    }
  }

  throw new Error(
    `All candidate Gemini models failed streaming chat. Diagnostics: ${JSON.stringify(errors)}`
  );
}

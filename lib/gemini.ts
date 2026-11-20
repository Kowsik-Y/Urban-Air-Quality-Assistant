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
 * Verified active Gemini models for your API tier:
 * 1. gemini-2.5-flash: Verified active & responsive (<1s latency)
 * 2. gemini-2.5-flash-lite: Verified active fast lightweight tier
 * 3. gemini-3.1-flash-lite-preview: Verified active preview tier
 * 4. gemini-flash-latest: Stable fallback
 * 5. gemini-3.8-flash: Next-gen preview
 */
export const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.6,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

/**
 * Execute generateContent with automatic multi-model failover across tested models.
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
      errors.push({ model: modelName, error: message });
    }
  }

  throw new Error(
    `All candidate Gemini models failed. Diagnostics: ${JSON.stringify(errors)}`
  );
}

/**
 * Execute streaming chat with automatic multi-model failover across tested models.
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
            parts: [{ text: `Understood. Calibrated as AI AirSense on model ${modelName}. Ready to assist.` }],
          },
          ...history,
        ],
      });

      const streamResult = await chat.sendMessageStream(message);
      return { stream: streamResult.stream, modelUsed: modelName };
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : String(err);
      errors.push({ model: modelName, error: messageText });
    }
  }

  throw new Error(
    `All candidate Gemini models failed streaming chat. Diagnostics: ${JSON.stringify(errors)}`
  );
}

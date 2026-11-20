import { CHAT_LIMITS } from './constants';

export interface StreamChunkResult {
  text: string;
  isComplete: boolean;
}

/**
 * Consumes a Server-Sent Events (SSE) readable stream from the `/api/chat` route,
 * decoding chunks, accumulating text, and extracting any trailing suggestion chips.
 *
 * @param stream - ReadableStream from the Fetch response body.
 * @param onToken - Callback invoked for each incremental content token.
 * @returns Resolves when stream finishes with final clean text and extracted suggestions.
 */
export async function consumeChatStream(
  stream: ReadableStream<Uint8Array>,
  onToken: (cumulativeText: string) => void
): Promise<{ text: string; suggestions: string[] }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let rawAccumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              rawAccumulated += parsed.text;

              // Separate conversational content from trailing delimiter
              const delimiterIndex = rawAccumulated.indexOf(CHAT_LIMITS.SUGGESTION_DELIMITER);
              const displayContent =
                delimiterIndex !== -1
                  ? rawAccumulated.slice(0, delimiterIndex).trim()
                  : rawAccumulated;

              onToken(displayContent);
            }
          } catch {
            // Tolerate partial JSON frames during stream delivery
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Final parsing of display content vs suggestions
  const delimiterIndex = rawAccumulated.indexOf(CHAT_LIMITS.SUGGESTION_DELIMITER);
  if (delimiterIndex !== -1) {
    const displayContent = rawAccumulated.slice(0, delimiterIndex).trim();
    const suggestionsPart = rawAccumulated
      .slice(delimiterIndex + CHAT_LIMITS.SUGGESTION_DELIMITER.length)
      .trim();

    const suggestions = suggestionsPart
      .split('\n')
      .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((s) => s.length > 0 && s.length < 120);

    return { text: displayContent, suggestions };
  }

  return { text: rawAccumulated.trim(), suggestions: [] };
}

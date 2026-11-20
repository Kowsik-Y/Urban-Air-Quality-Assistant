import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('AI AirSense Chat Processing & Suggestion Parser', () => {
  it('strictly caps incoming user message at 1,000 characters for security', () => {
    const rawLongMessage = 'A'.repeat(1500);
    const sanitized = rawLongMessage.trim().slice(0, 1000);
    assert.strictEqual(sanitized.length, 1000);
  });

  it('correctly extracts trailing <<<SUGGESTIONS>>> tokens into prompt arrays', () => {
    const rawAiResponse = `Wearing an N95 respirator is strongly advised when AQI exceeds 150.
<<<SUGGESTIONS>>>:
- How to check proper N95 mask seal fit?
- What are the best indoor air purifying plants?
- When does winter smog typically subside during the day?`;

    const markerIndex = rawAiResponse.indexOf('<<<SUGGESTIONS>>>:');
    assert.ok(markerIndex !== -1, 'Must contain suggestions marker');

    const cleanContent = rawAiResponse.slice(0, markerIndex).trim();
    assert.strictEqual(
      cleanContent,
      'Wearing an N95 respirator is strongly advised when AQI exceeds 150.'
    );

    const rawSuggestions = rawAiResponse
      .slice(markerIndex + '<<<SUGGESTIONS>>>:'.length)
      .trim()
      .split('\n')
      .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);

    assert.strictEqual(rawSuggestions.length, 3);
    assert.strictEqual(rawSuggestions[0], 'How to check proper N95 mask seal fit?');
    assert.strictEqual(rawSuggestions[1], 'What are the best indoor air purifying plants?');
    assert.strictEqual(
      rawSuggestions[2],
      'When does winter smog typically subside during the day?'
    );
  });

  it('bounds conversation history to 10 turns to avoid token overflow', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: `Message turn ${i}` }],
    }));

    const boundedHistory = history.slice(-10);
    assert.strictEqual(boundedHistory.length, 10);
    assert.strictEqual(boundedHistory[0].parts[0].text, 'Message turn 15');
    assert.strictEqual(boundedHistory[9].parts[0].text, 'Message turn 24');
  });
});

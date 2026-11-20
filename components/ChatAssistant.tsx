'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AQIData, ChatMessage, UserProfile } from '@/lib/types';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

interface ChatAssistantProps {
  selectedCity: string;
  aqiData: AQIData | null;
  userProfile: UserProfile;
}

const CONTEXTUAL_PROMPTS = [
  'What mask rating (N95 / FFP2 / N99) is required for today?',
  'Is it safe for my child / elderly parents to step outside today?',
  'What route or transit alternative minimizes inhaled particulate mass?',
  'What natural dietary or hydration antioxidants counter PM2.5 oxidative stress?',
];

export default function ChatAssistant({ selectedCity, aqiData, userProfile }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: `Hello! I am **AirSense Copilot**, your real-time smog & environmental health assistant for **${selectedCity || 'Urban India'}**.

${
  aqiData
    ? `Current Station AQI: **${aqiData.aqi}** (${aqiData.category}) in **${aqiData.city}**. Dominant pollutant: **${aqiData.dominantPollutant}**.`
    : 'Select a city in the header to calibrate me with live sensor feeds.'
}

Ask me anything regarding mask protocols, school/commute navigation, clean-room ventilation, or low-emission routines!`,
    },
  ]);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    setInput('');
    setStreaming(true);

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            city: selectedCity || 'Delhi',
            aqi: aqiData?.aqi || 200,
            aqiCategory: aqiData?.category || 'Unhealthy',
            userProfile,
            pm25: aqiData?.pm25,
            pm10: aqiData?.pm10,
          },
          history: historyRef.current,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming connection unavailable.');

      const decoder = new TextDecoder();
      let accumulated = '';

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
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: accumulated }] },
      ];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chat error';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `⚠️ **Connection Note**: ${msg}. Please ensure your \`GEMINI_API_KEY\` is configured in \`.env.local\`.`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [streaming, selectedCity, aqiData, userProfile]);

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] min-h-[500px] glass-card rounded-3xl overflow-hidden border border-slate-800">
      {/* Context Top bar */}
      <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-slate-300">Live Gemini 1.5 Flash Reasoning</span>
        </div>
        {aqiData && (
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400">{aqiData.city}:</span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-950"
              style={{ backgroundColor: aqiData.color }}
            >
              AQI {aqiData.aqi} ({aqiData.category})
            </span>
          </div>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {m.content ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Suggested Inquiries:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {CONTEXTUAL_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                disabled={streaming}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AirSense about masks, purifier settings, or smog routines..."
            disabled={streaming}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

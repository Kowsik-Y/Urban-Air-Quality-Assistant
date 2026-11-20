'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AQIData, ChatMessage, UserProfile } from '@/lib/types';
import { Send, Bot, User, Sparkles, MessageSquareQuote, X, Minimize2, Maximize2, Shield } from 'lucide-react';

interface FloatingChatDrawerProps {
  selectedCity: string;
  aqiData: AQIData | null;
  userProfile: UserProfile;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_PROMPTS = [
  'What mask rating (N95 / FFP2) is needed today?',
  'Is it safe for children to play outside right now?',
  'Which commute route has the lowest roadside PM2.5?',
  'Best indoor purifier setting for sleep?',
];

export default function FloatingChatDrawer({
  selectedCity,
  aqiData,
  userProfile,
  isOpen,
  onToggle,
}: FloatingChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: `Hello! I am **AirSense Copilot**, your live winter smog & air pollution assistant for **${selectedCity || 'Urban India'}**.

${
  aqiData
    ? `Live AQI: **${aqiData.aqi}** (${aqiData.category}) in **${aqiData.city}**. Dominant pollutant: **${aqiData.dominantPollutant}**.`
    : 'Select your city to calibrate me with live sensor feeds.'
}

How can I help you protect your household today?`,
    },
  ]);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream connection unavailable.');

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
              // Ignore partial parsing chunks
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
      const msg = err instanceof Error ? err.message : 'Error reaching assistant';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `⚠️ **Notice**: ${msg}. Please ensure your \`GEMINI_API_KEY\` is active.`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [streaming, selectedCity, aqiData, userProfile]);

  return (
    <>
      {/* Floating Action Button (Always Visible) */}
      <button
        onClick={onToggle}
        aria-label="Toggle AirSense Copilot Chat"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transform hover:scale-105 transition-all duration-300 group cursor-pointer border border-cyan-300/40"
      >
        <div className="relative">
          <MessageSquareQuote className="w-5 h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
        </div>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          AirSense Copilot
        </span>
        {aqiData && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-black text-slate-950 shadow-inner hidden sm:inline"
            style={{ backgroundColor: aqiData.color }}
          >
            AQI {aqiData.aqi}
          </span>
        )}
      </button>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[560px] max-h-[80vh] glass-card rounded-3xl border border-cyan-500/30 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-fade-in backdrop-blur-2xl">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-tight">AirSense Copilot</h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Live AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {aqiData ? `${aqiData.city} (AQI: ${aqiData.aqi})` : 'Urban Smog Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.content ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Suggested Inquiries */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60">
              <p className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Quick Prompts:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    disabled={streaming}
                    className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-slate-900/95 border-t border-slate-800">
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
                placeholder="Ask about masks, purifiers, commute..."
                disabled={streaming}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AQIData, ChatMessage, UserProfile } from '@/lib/types';
import { Send, Bot, User, Sparkles, MessageSquareQuote, X, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FloatingChatDrawerProps {
  selectedCity: string;
  aqiData: AQIData | null;
  userProfile: UserProfile;
  isOpen: boolean;
  onToggle: () => void;
}

const INITIAL_PROMPTS = [
  'What mask rating (N95 / FFP2) is needed today?',
  'Is it safe for children or elderly to step outside?',
  'Which commute option has the lowest inhaled PM2.5?',
  'Best indoor HEPA purifier run time for sleep?',
  'Can I do outdoor exercise in the afternoon?',
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
      content: `Hello! I am **AI AirSense**, your real-time winter smog & environmental health assistant for **${selectedCity || 'Urban India'}**.

${
  aqiData
    ? `Live Environmental Status: **AQI ${aqiData.aqi}** (${aqiData.category}) in **${aqiData.city}**. Dominant pollutant: **${aqiData.dominantPollutant}**.`
    : 'Select a city in the header to calibrate me with live sensor feeds.'
}

How can I help you and your family navigate air quality today?`,
    },
  ]);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_PROMPTS);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Generate dynamic follow-up suggestions based on conversation context
  const updateDynamicSuggestions = useCallback((lastResponse: string, aqiVal?: number) => {
    const text = lastResponse.toLowerCase();
    const dynamicList: string[] = [];

    if (text.includes('mask') || text.includes('n95')) {
      dynamicList.push('How often should I replace my N95 mask?');
      dynamicList.push('Are cloth or surgical masks effective against PM2.5?');
    }
    if (text.includes('child') || text.includes('school') || text.includes('kid')) {
      dynamicList.push('Should schools suspend morning outdoor assembly?');
      dynamicList.push('Safe indoor play activities during severe smog?');
    }
    if (text.includes('purifier') || text.includes('hepa') || text.includes('indoor')) {
      dynamicList.push('What CADR rating do I need for my room size?');
      dynamicList.push('Do indoor plants really replace air purifiers?');
    }
    if (text.includes('commute') || text.includes('traffic') || text.includes('metro')) {
      dynamicList.push('Is AC recirculate mode better while driving in smog?');
      dynamicList.push('How does roadside exposure compare to metro travel?');
    }

    if (aqiVal && aqiVal > 200) {
      dynamicList.push('What are early symptoms of acute particulate toxicity?');
      dynamicList.push('Can steam inhalation or jaggery clear smog particles?');
    } else {
      dynamicList.push('Best window opening window for natural ventilation today?');
    }

    if (dynamicList.length < 3) {
      dynamicList.push('Natural dietary antioxidants to counteract oxidative smog stress?');
      dynamicList.push('How does night-time thermal inversion trap ground pollution?');
    }

    setSuggestions(dynamicList.slice(0, 5));
  }, []);

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
              // Ignore partial JSON parses
            }
          }
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: accumulated }] },
      ];

      // Update auto-suggestions dynamically from LLM output
      updateDynamicSuggestions(accumulated, aqiData?.aqi);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching assistant';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Connection alert: ${msg}. Please ensure your \`GEMINI_API_KEY\` is active.`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [streaming, selectedCity, aqiData, userProfile, updateDynamicSuggestions]);

  return (
    <>
      {/* Floating Action Button (Always Visible) */}
      <button
        onClick={onToggle}
        aria-label="Toggle AI AirSense Chat"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transform hover:scale-105 transition-all duration-300 group cursor-pointer border border-cyan-300/40"
      >
        <div className="relative">
          <MessageSquareQuote className="w-5 h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
        </div>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          AI AirSense
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
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[82vh] glass-card rounded-3xl border border-cyan-500/30 shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-fade-in backdrop-blur-2xl">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-tight">AI AirSense</h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                  {aqiData ? `${aqiData.city} (AQI: ${aqiData.aqi})` : 'Urban Smog Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close AI AirSense"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
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
                      <div className="space-y-1.5 break-words">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-cyan-300">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
                            li: ({ children }) => <li className="text-slate-200">{children}</li>,
                            code: ({ children }) => (
                              <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 text-[11px] font-mono">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
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

          {/* Horizontal Scroll Quick Response / Auto-Suggestions Viewport */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/70">

            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
            >
              {suggestions.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={streaming}
                  className="inline-flex items-center gap-1.5 flex-shrink-0 text-[11px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left whitespace-nowrap cursor-pointer shadow-sm group"
                >
                  <span>{prompt}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cyan-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Input Row */}
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
                placeholder="Ask about masks, purifier settings, commute..."
                disabled={streaming}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Send Message"
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

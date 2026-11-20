'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

export default function FloatingChatDrawer({
  selectedCity,
  aqiData,
  userProfile,
  isOpen,
  onToggle,
}: FloatingChatDrawerProps) {
  // Dynamically generated greeting based on live telemetry
  const initialGreeting = useMemo(() => {
    if (!aqiData) {
      return `Welcome to **AI AirSense**. Select a city in the header to initialize live CAAQMS telemetry.`;
    }
    return `Hello. I am **AI AirSense**, calibrated with live telemetry from **${aqiData.station}** in **${aqiData.city}**.

Current reading: **AQI ${aqiData.aqi}** (${aqiData.category}) with dominant pollutant **${aqiData.dominantPollutant}**${aqiData.pm25 != null ? ` at ${aqiData.pm25} µg/m³` : ''
      }.

Context calibrated for: **${userProfile.replace(/_/g, ' ')}**. What would you like to know about navigating today's air quality?`;
  }, [aqiData, userProfile]);

  // Dynamically generated initial prompts derived from live sensor metrics
  const dynamicInitialPrompts = useMemo(() => {
    if (!aqiData) return [];
    const cityShort = aqiData.city.split(',')[0].trim();
    const pol = aqiData.dominantPollutant || 'PM2.5';
    const aqi = aqiData.aqi;
    const profileReadable = userProfile.replace(/_/g, ' ');

    return [
      `What mask rating is mandatory for AQI ${aqi} in ${cityShort}?`,
      `Is outdoor physical exertion safe today for ${profileReadable}?`,
      `How does ${pol} concentration of ${aqiData.pm25 ?? aqi} µg/m³ affect indoor air?`,
      `Recommended low-emission transit route in ${cityShort} to minimize exposure?`,
      `Optimal indoor HEPA purifier run protocol for current ${aqiData.category} smog?`,
    ];
  }, [aqiData, userProfile]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  // Auto focus input and support Escape key dismissal when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onToggle();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onToggle]);

  // Sync initial message when aqiData or profile changes and no conversation has occurred yet
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: initialGreeting }]);
    }
  }, [initialGreeting, messages.length]);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Active suggestions: LLM-generated follow-ups if available, otherwise telemetry-derived prompts
  const activeSuggestions = llmSuggestions.length > 0 ? llmSuggestions : dynamicInitialPrompts;

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
            city: aqiData?.city || selectedCity || 'Urban India',
            aqi: aqiData?.aqi || 150,
            aqiCategory: aqiData?.category || 'Moderate',
            userProfile,
            pm25: aqiData?.pm25,
            pm10: aqiData?.pm10,
            dominantPollutant: aqiData?.dominantPollutant,
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
      let rawAccumulated = '';

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

                // Split display content from <<<SUGGESTIONS>>> delimiter
                const delimiterIndex = rawAccumulated.indexOf('<<<SUGGESTIONS>>>:');
                const displayContent = delimiterIndex !== -1
                  ? rawAccumulated.slice(0, delimiterIndex).trim()
                  : rawAccumulated;

                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: displayContent };
                  return updated;
                });
              }
            } catch {
              // Ignore partial JSON parses during streaming
            }
          }
        }
      }

      // Extract LLM-generated follow-up questions
      const delimiterIndex = rawAccumulated.indexOf('<<<SUGGESTIONS>>>:');
      if (delimiterIndex !== -1) {
        const suggestionsPart = rawAccumulated.slice(delimiterIndex + 18).trim();
        const extractedQuestions = suggestionsPart
          .split('|')
          .map((q) => q.replace(/^[\[\s]+|[\]\s]+$/g, '').trim())
          .filter((q) => q.length > 5);

        if (extractedQuestions.length > 0) {
          setLlmSuggestions(extractedQuestions);
        }
      }

      const cleanFinalContent = delimiterIndex !== -1
        ? rawAccumulated.slice(0, delimiterIndex).trim()
        : rawAccumulated;

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: cleanFinalContent }] },
      ];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching AI assistant';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Connection alert: ${msg}. Please ensure your \`GEMINI_API_KEY\` is active in \`.env.local\`.`,
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
        aria-label="Toggle AI AirSense Chat Assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transform hover:scale-105 transition-all duration-300 group cursor-pointer border border-cyan-300/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-drawer-title"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[82vh] glass-card rounded-3xl border border-cyan-500/30 shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-fade-in backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow">
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 id="chat-drawer-title" className="text-xs font-bold text-white tracking-tight">
                    AI AirSense
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                  {aqiData ? `${aqiData.city} (AQI: ${aqiData.aqi})` : 'Urban Smog Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Close AI AirSense"
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
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow ${isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white'
                      }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <MessageSquareQuote className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow ${isUser
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
          {activeSuggestions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/70">

              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
              >
                {activeSuggestions.map((prompt, i) => (
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
          )}

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
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about masks, purifier settings, commute..."
                aria-label="Air quality question or instruction"
                disabled={streaming}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Send Message"
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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

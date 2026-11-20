import React from 'react';
import type { Recommendations } from '@/lib/types';
import { Home, Wind } from 'lucide-react';
import { getDynamicIcon } from './RecommendationCards';

interface IndoorGuideProps {
  recommendations: Recommendations | null;
  loading: boolean;
}

export default function IndoorGuide({ recommendations, loading }: IndoorGuideProps) {
  const dynamicTips = recommendations?.indoorTips || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800/50 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 bg-slate-800/40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || dynamicTips.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto my-8">
        <Home className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">Indoor IAQ Telemetry Awaiting Selection</h3>
        <p className="text-sm text-slate-500 mt-2">
          Select a city in the header to synthesize dynamic indoor clean-air protocols tailored to current ambient pollutant infiltration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Home className="w-5 h-5 text-cyan-400" />
          <span>Indoor Air Quality (IAQ) Clean-Room Protocols</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic micro-environment defense strategies calibrated against ambient particulate concentration and thermal inversion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dynamicTips.map((tip, idx) => {
          const iconElement = getDynamicIcon(tip, 'indoor');

          return (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      {iconElement}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight group-hover:text-cyan-300 transition-colors">
                      {tip.title}
                    </h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40 flex-shrink-0">
                    Protocol {idx + 1}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  {tip.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tip.impact}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Real-time AI IAQ</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

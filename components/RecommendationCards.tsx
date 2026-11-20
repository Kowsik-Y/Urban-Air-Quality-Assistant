import React from 'react';
import type { Recommendations, AQIData, Recommendation } from '@/lib/types';
import { Bike, Home, Leaf, ShieldAlert, Sparkles, TrendingDown, ArrowRight } from 'lucide-react';

interface RecommendationCardsProps {
  recommendations: Recommendations | null;
  aqiData: AQIData | null;
  loading: boolean;
}

function ImpactCard({ item }: { item: Recommendation }) {
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-300 group">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
            {item.icon || '🌱'}
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
          {item.description}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-800/60">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-700/40">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          <span>{item.impact}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationCards({
  recommendations,
  aqiData,
  loading,
}: RecommendationCardsProps) {
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-800/50 rounded-2xl w-full" />
        <div className="space-y-3">
          <div className="h-6 bg-slate-800/50 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 bg-slate-800/40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto my-8">
        <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">No Recommendations Yet</h3>
        <p className="text-sm text-slate-500 mt-2">
          Select a city above to generate GenAI-powered smog routines and sustainable lifestyle alternatives.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Situational Urgency Alert */}
      {recommendations.urgencyMessage && (
        <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/40 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-cyan-400">
              Live AI Situation Strategy
            </h4>
            <p className="text-sm font-medium text-slate-200 mt-1 leading-relaxed">
              {recommendations.urgencyMessage}
            </p>
          </div>
        </div>
      )}

      {/* Health Warning */}
      {recommendations.healthAlert && aqiData && aqiData.aqi > 150 && (
        <div className="rounded-2xl p-5 border border-red-500/40 bg-red-950/30 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-red-400">
              Direct Biological Exposure Warning
            </h4>
            <p className="text-sm text-red-200 mt-1 leading-relaxed">
              {recommendations.healthAlert}
            </p>
          </div>
        </div>
      )}

      {/* 1. Low Emission Daily Routines */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Bike className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">
            1. Low-Emission Daily Routines
          </h3>
          <span className="text-xs text-slate-500 ml-auto hidden sm:inline">Personal Commute & Exposure Hacks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.lowEmissionRoutines.map((item, idx) => (
            <ImpactCard key={idx} item={item} />
          ))}
        </div>
      </section>

      {/* 2. Indoor Air Quality Hacks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Home className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">
            2. Indoor Air Quality Defense
          </h3>
          <span className="text-xs text-slate-500 ml-auto hidden sm:inline">Clean Room & Micro-environment</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.indoorTips.map((item, idx) => (
            <ImpactCard key={idx} item={item} />
          ))}
        </div>
      </section>

      {/* 3. Sustainable Alternatives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Leaf className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">
            3. Sustainable Alternatives & Community Footprint
          </h3>
          <span className="text-xs text-slate-500 ml-auto hidden sm:inline">Systemic Smog Mitigation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.sustainableAlternatives.map((item, idx) => (
            <ImpactCard key={idx} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

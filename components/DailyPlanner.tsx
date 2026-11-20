import React from 'react';
import type { Recommendations } from '@/lib/types';
import { Sunrise, Sun, Moon, Calendar, CheckCircle2 } from 'lucide-react';

interface DailyPlannerProps {
  recommendations: Recommendations | null;
  loading: boolean;
}

const TIMELINE_BLOCKS = [
  {
    key: 'morning' as const,
    label: 'Morning Inversion Window',
    hours: '06:00 AM – 10:00 AM',
    icon: <Sunrise className="w-5 h-5 text-amber-400" />,
    gradient: 'from-amber-500/10 via-slate-900/50 to-slate-900/80',
    border: 'border-amber-500/30',
    tag: 'Highest Smog Density',
  },
  {
    key: 'afternoon' as const,
    label: 'Afternoon Solar Dispersion',
    hours: '11:00 AM – 04:00 PM',
    icon: <Sun className="w-5 h-5 text-yellow-400" />,
    gradient: 'from-yellow-500/10 via-slate-900/50 to-slate-900/80',
    border: 'border-yellow-500/30',
    tag: 'Lowest Ground Particulates',
  },
  {
    key: 'evening' as const,
    label: 'Nocturnal Smog Settling',
    hours: '05:00 PM – 10:00 PM',
    icon: <Moon className="w-5 h-5 text-indigo-400" />,
    gradient: 'from-indigo-500/10 via-slate-900/50 to-slate-900/80',
    border: 'border-indigo-500/30',
    tag: 'Secondary Traffic Inversion',
  },
];

export default function DailyPlanner({ recommendations, loading }: DailyPlannerProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-36 bg-slate-800/40 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto my-8">
        <Calendar className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">Planner Awaiting City Selection</h3>
        <p className="text-sm text-slate-500 mt-2">
          Select a city to build an hour-by-hour winter smog schedule matching local atmospheric boundary layers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Adaptive Smog Daily Planner</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated against temperature inversion & diurnal particulate variations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {TIMELINE_BLOCKS.map((block) => {
          const planText = recommendations.dailyPlanner[block.key];
          return (
            <div
              key={block.key}
              className={`rounded-2xl p-6 border bg-gradient-to-r ${block.gradient} ${block.border} transition-all duration-300 hover:scale-[1.01] shadow-xl`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    {block.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{block.label}</h3>
                    <span className="text-xs font-mono text-slate-400">{block.hours}</span>
                  </div>
                </div>
                <span className="self-start sm:self-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 border border-slate-800 text-slate-300">
                  {block.tag}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {planText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

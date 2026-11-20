import React from 'react';
import type { AQIData } from '@/lib/types';
import { getPollutantStatus } from '@/lib/aqi';
import { AlertTriangle, Radio, ExternalLink, Activity } from 'lucide-react';

interface AQIDashboardProps {
  aqiData: AQIData;
}

const POLLUTANT_SPECS = [
  { key: 'pm25' as const, label: 'PM 2.5', desc: 'Fine Respirable Dust', unit: 'µg/m³', max: 300 },
  { key: 'pm10' as const, label: 'PM 10', desc: 'Coarse Particulates', unit: 'µg/m³', max: 500 },
  { key: 'no2' as const, label: 'NO₂', desc: 'Nitrogen Dioxide (Vehicular)', unit: 'µg/m³', max: 300 },
  { key: 'so2' as const, label: 'SO₂', desc: 'Sulfur Dioxide (Industrial)', unit: 'µg/m³', max: 200 },
  { key: 'o3' as const, label: 'O₃', desc: 'Ground Ozone (Smog precursor)', unit: 'µg/m³', max: 200 },
  { key: 'co' as const, label: 'CO', desc: 'Carbon Monoxide', unit: 'mg/m³', max: 20 },
];

export default function AQIDashboard({ aqiData }: AQIDashboardProps) {
  const { aqi, category, color, healthMessage, station, timestamp, source, sourceUrl, isFallback, dominantPollutant } = aqiData;

  // Circle geometry with generous buffer to prevent SVG viewport shadow cut-off
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const clampedAQI = Math.min(Math.max(aqi, 0), 500);
  const strokeDashoffset = circumference * (1 - clampedAQI / 500);

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  }, [timestamp]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Visualizer */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-20"
          style={{ backgroundColor: color }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Radial Gauge Meter */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 flex items-center justify-center p-2">
              <svg
                className="w-full h-full -rotate-90 transform overflow-visible"
                viewBox="0 0 200 200"
              >
                {/* Background Track */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  className="stroke-slate-800/80"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Live Progress Arc with smooth unclipped glow */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={color}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 10px ${color}80)`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-5xl font-black tracking-tight" style={{ color }}>
                  {aqi}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  CPCB AQI
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Index 0–500
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 shadow-md"
                style={{ backgroundColor: color }}
              >
                {category}
              </span>
            </div>
          </div>

          {/* Contextual Real-time Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Real-Time Environmental Diagnostics</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {aqiData.city}
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              {healthMessage}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Dominant Pollutant</span>
                <span className="text-base font-bold text-cyan-300 font-mono">{dominantPollutant}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Monitoring Station</span>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1" title={station}>{station}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 block font-medium">Last Reading (IST)</span>
                <span className="text-xs font-semibold text-slate-200">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Smog Warning if severe */}
      {aqi > 150 && (
        <div className="rounded-2xl p-4 sm:p-5 border border-red-500/40 bg-gradient-to-r from-red-950/60 via-red-900/30 to-slate-900/60 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-300">Winter Inversion Smog Advisory</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Fine inhalable particulates are trapped near ground level. Limit outdoor physical exertion, avoid morning walks before 8:30 AM, and ensure children & elderly stay inside closed clean-air rooms.
            </p>
          </div>
        </div>
      )}

      {/* Criteria Pollutant Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Direct Sensor Concentrations</span>
            <span className="text-[10px] text-slate-500 font-normal">Continuous Ambient Air Quality Monitoring (CAAQMS)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {POLLUTANT_SPECS.map((p) => {
            const val = aqiData[p.key];
            const status = getPollutantStatus(p.key, val);
            const percentage = val != null ? Math.min((val / p.max) * 100, 100) : 0;

            return (
              <div key={p.key} className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-base font-bold text-white tracking-wide">{p.label}</span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${status.color}22`, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{p.desc}</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      {val != null ? val : '—'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{p.unit}</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attribution & Transparency footer */}
      <div className="p-4 rounded-xl glass text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-500" />
          <span>Source: <strong>{source}</strong></span>
          {isFallback && <span className="text-amber-400"> (Fallback estimated baseline)</span>}
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>Verify Live Station Data</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

import React from 'react';
import type { Recommendations } from '@/lib/types';
import { Home, ShieldCheck, Wind, AlertCircle, Sparkles } from 'lucide-react';

interface IndoorGuideProps {
  recommendations: Recommendations | null;
  loading: boolean;
}

const SCIENTIFIC_INDOOR_HACKS = [
  {
    icon: '🪴',
    title: 'NASA-Certified Phytoremediation Plants',
    tag: 'Passive Bio-Purification',
    description: 'Sansevieria (Snake Plant), Epipremnum (Money Plant), and Areca Palm absorb toxic VOCs (benzene, formaldehyde, trichloroethylene) and emit night-time oxygen via Crassulacean Acid Metabolism (CAM).',
    recommendation: 'Place 3 to 4 adult waist-high plants per 100 sq ft room. Wipe leaves weekly with damp cotton to prevent particulate pore clogging.',
    benefit: 'Reduces indoor VOC mass by 20–35%',
  },
  {
    icon: '💨',
    title: 'Clean Air Sanctuary & Positive Pressure',
    tag: 'Mechanical Barrier',
    description: 'During severe inversion smog (AQI > 250), ambient dust infiltrates doors, window jambs, and ventilation shafts. Create one designated bedroom as a sealed "Clean Room".',
    recommendation: 'Run an H13 True-HEPA purifier 24/7 in this room. Seal door undersides with silicone draft stoppers or damp towels. Keep bedroom doors shut.',
    benefit: 'Reduces PM2.5 by 90–95% inside sanctuary',
  },
  {
    icon: '🍳',
    title: 'Combustion & Sautéing Mitigation',
    tag: 'Source Control',
    description: 'Gas stoves, tempering spices (tadka), and agarbatti/dhoop burning emit ultrafine particulates (<0.1 µm) and toxic NO2 that linger indoors for 4–6 hours.',
    recommendation: 'Run kitchen exhaust at maximum speed with kitchen doors closed. Avoid unventilated high-smoke cooking on high-AQI days. Replace incense with LED lamps or ultrasonic essential oil mists.',
    benefit: 'Eliminates 75% of indoor ultrafine spikes',
  },
  {
    icon: '🧹',
    title: 'Damp Mopping vs Dry Sweeping',
    tag: 'Dust Re-suspension',
    description: 'Brooms and dry vacuum cleaners without HEPA exhaust violently re-suspend toxic settled PM10 and heavy metals straight into breathing height.',
    recommendation: 'Always wet-mop floors with warm water and microfibre cloths. Clean air conditioner mesh pre-filters every 15 days.',
    benefit: 'Prevents 60% particulate re-aerosolization',
  },
];

export default function IndoorGuide({ recommendations, loading }: IndoorGuideProps) {
  const dynamicTips = recommendations?.indoorTips || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Home className="w-5 h-5 text-cyan-400" />
          <span>Indoor Air Quality (IAQ) Defense Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Indoor air is frequently 2–5x more hazardous than outdoor air due to enclosed chemical entrapment.
        </p>
      </div>

      {/* AI Tailored tips */}
      {!loading && dynamicTips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Real-Time Indoor Prescriptions</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicTips.map((tip, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <h4 className="text-sm font-bold text-slate-100">{tip.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {tip.description}
                </p>
                <div className="pt-2 text-xs font-semibold text-emerald-300">
                  ✦ {tip.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Framework Guide */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Core Indoor Engineering Hacks</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SCIENTIFIC_INDOOR_HACKS.map((hack, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{hack.icon}</span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-100">{hack.title}</h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                    {hack.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {hack.description}
                </p>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-cyan-400 font-semibold block mb-0.5">Protocol:</strong>
                  {hack.recommendation}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5" />
                  <span>{hack.benefit}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

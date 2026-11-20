'use client';

import React from 'react';
import type { AQIData, City, UserProfile } from '@/lib/types';
import { Wind, ShieldAlert, Sparkles, MapPin, Users } from 'lucide-react';

const PROFILES: { value: UserProfile; label: string }[] = [
  { value: 'general', label: 'General Resident' },
  { value: 'family_with_kids', label: 'Family with Kids' },
  { value: 'working_professional', label: 'Working Professional' },
  { value: 'senior_citizen', label: 'Senior Citizen' },
  { value: 'student', label: 'Student / Youth' },
];

interface HeaderProps {
  cities: City[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  aqiData: AQIData | null;
}

export default function Header({
  cities,
  selectedCity,
  onCityChange,
  userProfile,
  onProfileChange,
  aqiData,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800/80 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">
                  AirSense
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800/50 uppercase">
                  GenAI 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Urban Smog & Community Guardian</p>
            </div>
          </div>

          {/* Quick badge on mobile */}
          {aqiData && (
            <div
              className="md:hidden px-3 py-1 rounded-full text-xs font-bold text-slate-950 shadow"
              style={{ backgroundColor: aqiData.color }}
            >
              AQI {aqiData.aqi}
            </div>
          )}
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          {/* City Selection */}
          <div className="relative flex-1 sm:w-56">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all appearance-none cursor-pointer shadow-inner"
            >
              <option value="" disabled>Select City (Live Sensors)...</option>
              {cities.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} {c.state ? `(${c.state})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Selection */}
          <div className="relative flex-1 sm:w-56">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            <select
              value={userProfile}
              onChange={(e) => onProfileChange(e.target.value as UserProfile)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all appearance-none cursor-pointer shadow-inner"
            >
              {PROFILES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Indicator Tag */}
          {aqiData && (
            <div
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-950 shadow-md transition-all"
              style={{ backgroundColor: aqiData.color }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AQI {aqiData.aqi}</span>
              <span className="opacity-80 font-normal">({aqiData.category})</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

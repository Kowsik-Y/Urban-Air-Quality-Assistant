'use client';

import React from 'react';
import type { TabId } from '@/lib/types';
import { Activity, Sparkles, CalendarClock, Home, MessageSquareQuote } from 'lucide-react';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Live AQI Monitor', icon: <Activity className="w-4 h-4" /> },
  { id: 'recommendations', label: 'AI Lifestyle & Impact', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'planner', label: 'Smog Daily Planner', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'indoor', label: 'Indoor Clean Air Hacks', icon: <Home className="w-4 h-4" /> },
  { id: 'chat', label: 'AirSense Copilot', icon: <MessageSquareQuote className="w-4 h-4" /> },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="sticky top-[65px] z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

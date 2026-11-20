'use client';

import React, { useRef } from 'react';
import type { TabId } from '@/lib/types';
import { Activity, Sparkles, CalendarClock, Home } from 'lucide-react';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Live AQI Monitor', icon: <Activity className="w-4 h-4" /> },
  { id: 'recommendations', label: 'AI Lifestyle & Impact', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'planner', label: 'Smog Daily Planner', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'indoor', label: 'Indoor Clean Air Hacks', icon: <Home className="w-4 h-4" /> },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[nextIndex];
    if (nextTab) {
      onTabChange(nextTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <nav
      className="sticky top-[65px] z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-md"
      aria-label="Application Sections"
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar"
      >
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-500'} aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

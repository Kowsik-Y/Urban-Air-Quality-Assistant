'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { AQIData, City, Recommendations, TabId, UserProfile } from '@/lib/types';
import Header from './Header';
import TabNav from './TabNav';
import AQIDashboard from './AQIDashboard';
import RecommendationCards from './RecommendationCards';
import DailyPlanner from './DailyPlanner';
import IndoorGuide from './IndoorGuide';
import LoadingState from './LoadingState';
import FloatingChatDrawer from './FloatingChatDrawer';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AppShellProps {
  initialCities: City[];
}

export default function AppShell({ initialCities }: AppShellProps) {
  const [selectedCity, setSelectedCity] = useState<string>('delhi');
  const [userProfile, setUserProfile] = useState<UserProfile>('general');
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loadingAQI, setLoadingAQI] = useState<boolean>(true);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);

  const loadData = useCallback(async (city: string, profile: UserProfile) => {
    if (!city) return;

    setLoadingAQI(true);
    setLoadingRecs(true);
    setError(null);

    try {
      // 1. Fetch real-time live sensor AQI
      const aqiRes = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
      const aqiJson = await aqiRes.json();

      if (!aqiRes.ok) {
        throw new Error(aqiJson.error || 'Failed to retrieve live sensor data for this city.');
      }

      const freshAQI: AQIData = aqiJson;
      setAqiData(freshAQI);
      setLoadingAQI(false);

      // 2. Feed real live numbers into Gemini GenAI for recommendations
      const recRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: freshAQI.city,
          aqi: freshAQI.aqi,
          aqiCategory: freshAQI.category,
          userProfile: profile,
          pm25: freshAQI.pm25,
          pm10: freshAQI.pm10,
          dominantPollutant: freshAQI.dominantPollutant,
        }),
      });

      const recJson = await recRes.json();

      if (!recRes.ok) {
        console.warn('AI Recommendations warning:', recJson.error);
      } else {
        setRecommendations(recJson);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to synchronize with air quality network.';
      setError(msg);
    } finally {
      setLoadingAQI(false);
      setLoadingRecs(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadData(selectedCity, userProfile);
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    loadData(city, userProfile);
  };

  const handleProfileChange = (profile: UserProfile) => {
    setUserProfile(profile);
    if (selectedCity) {
      loadData(selectedCity, profile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      {/* Dynamic Header */}
      <Header
        cities={initialCities}
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        userProfile={userProfile}
        onProfileChange={handleProfileChange}
        aqiData={aqiData}
      />

      {/* Tabs (Main navigation for monitor, routines, planner, indoor) */}
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {loadingAQI ? (
          <LoadingState />
        ) : error ? (
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 border border-red-500/30">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Sensor Sync Interrupted</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => loadData(selectedCity, userProfile)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-600/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Live Connection</span>
            </button>
          </div>
        ) : !aqiData ? (
          <div className="text-center py-20 text-slate-500">
            Please pick a city from the selector above to display live station analytics.
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && <AQIDashboard aqiData={aqiData} />}
            {activeTab === 'recommendations' && (
              <RecommendationCards
                recommendations={recommendations}
                aqiData={aqiData}
                loading={loadingRecs}
              />
            )}
            {activeTab === 'planner' && (
              <DailyPlanner recommendations={recommendations} loading={loadingRecs} />
            )}
            {activeTab === 'indoor' && (
              <IndoorGuide recommendations={recommendations} loading={loadingRecs} />
            )}
          </div>
        )}
      </main>

      {/* Floating AI AirSense Chat Action Button & Drawer */}
      <FloatingChatDrawer
        selectedCity={selectedCity}
        aqiData={aqiData}
        userProfile={userProfile}
        isOpen={isFloatingChatOpen}
        onToggle={() => setIsFloatingChatOpen((prev) => !prev)}
      />

    </div>
  );
}

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { AQIData, City, Recommendations, TabId, UserProfile } from '@/lib/types';
import Header from './Header';
import TabNav from './TabNav';
import AQIDashboard from './AQIDashboard';
import RecommendationCards from './RecommendationCards';
import DailyPlanner from './DailyPlanner';
import IndoorGuide from './IndoorGuide';
import LoadingState from './LoadingState';
import FloatingChatDrawer from './FloatingChatDrawer';
import { AlertCircle, RefreshCw, Navigation } from 'lucide-react';
import { SESSION_KEYS, getSessionStorage, setSessionStorage } from '@/lib/storage';
import { findNearestCity } from '@/lib/cities';

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
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  const loadData = useCallback(async (city: string, profile: UserProfile) => {
    if (!city) return;

    setError(null);

    // 1. Check session cache for telemetry
    const telemetryCacheKey = `${SESSION_KEYS.TELEMETRY_PREFIX}${city.toLowerCase()}`;
    const cachedAqi = getSessionStorage<AQIData | null>(telemetryCacheKey, null);
    if (cachedAqi) {
      setAqiData(cachedAqi);
      setLoadingAQI(false);
    } else {
      setLoadingAQI(true);
    }

    // 2. Check session cache for AI recommendations
    const recsCacheKey = `${SESSION_KEYS.RECS_PREFIX}${city.toLowerCase()}_${profile}`;
    const cachedRecs = getSessionStorage<Recommendations | null>(recsCacheKey, null);
    if (cachedRecs) {
      setRecommendations(cachedRecs);
      setLoadingRecs(false);
    } else {
      setLoadingRecs(true);
    }

    try {
      // Fetch fresh live sensor AQI
      const aqiRes = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
      const aqiJson = await aqiRes.json();

      if (!aqiRes.ok) {
        throw new Error(aqiJson.error || 'Failed to retrieve live sensor data for this city.');
      }

      const freshAQI: AQIData = aqiJson;
      setAqiData(freshAQI);
      setSessionStorage(telemetryCacheKey, freshAQI);
      setLoadingAQI(false);

      // If recommendations were not cached in session, fetch from Gemini
      if (!cachedRecs) {
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
          setSessionStorage(recsCacheKey, recJson);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      if (!cachedAqi) {
        const msg = err instanceof Error ? err.message : 'Failed to synchronize with air quality network.';
        setError(msg);
      }
    } finally {
      setLoadingAQI(false);
      setLoadingRecs(false);
    }
  }, []);

  // Hydrate user session from sessionStorage on mount
  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      const savedCity = getSessionStorage<string>(SESSION_KEYS.CITY, 'delhi');
      const savedProfile = getSessionStorage<UserProfile>(SESSION_KEYS.PROFILE, 'general');
      const savedTab = getSessionStorage<TabId>(SESSION_KEYS.ACTIVE_TAB, 'dashboard');
      const savedDrawer = getSessionStorage<boolean>(SESSION_KEYS.DRAWER_OPEN, false);

      setSelectedCity(savedCity);
      setUserProfile(savedProfile);
      setActiveTab(savedTab);
      setIsFloatingChatOpen(savedDrawer);

      loadData(savedCity, savedProfile);
    }
  }, [loadData]);

  // Auto-request location permission on entry; fallback to IP geolocation if denied
  useEffect(() => {
    const calibrated = getSessionStorage<string | null>(SESSION_KEYS.LOCATION_CALIBRATED, null);
    if (calibrated) return;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`/api/cities?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.city) {
                const liveCity = data.city;
                setSelectedCity(liveCity.value);
                setSessionStorage(SESSION_KEYS.CITY, liveCity.value);
                setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'gps');
                loadData(liveCity.value, userProfile);
                setLocationToast(`GPS granted: Connected to live monitor: ${liveCity.label}`);
                setTimeout(() => setLocationToast(null), 5000);
                return;
              }
            }
          } catch {}

          const { city: nearest } = findNearestCity(latitude, longitude, initialCities);
          setSelectedCity(nearest.value);
          setSessionStorage(SESSION_KEYS.CITY, nearest.value);
          setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'gps');
          loadData(nearest.value, userProfile);
          setLocationToast(`GPS granted: Calibrated to nearest monitor: ${nearest.label}`);
          setTimeout(() => setLocationToast(null), 5000);
        },
        async (err) => {
          console.warn('[Location Permission Declined]', err.message);
          // FALLBACK TO IP LOCATION IF GPS DENIED
          try {
            const ipRes = await fetch('/api/cities?ip=1');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData?.success && ipData.city) {
                const ipCity = ipData.city;
                setSelectedCity(ipCity.value);
                setSessionStorage(SESSION_KEYS.CITY, ipCity.value);
                setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'ip');
                loadData(ipCity.value, userProfile);
                setLocationToast(
                  `GPS declined. Auto-detected approximate location via IP: ${ipCity.label}${
                    ipData.detectedCity ? ` (${ipData.detectedCity})` : ''
                  }`
                );
                setTimeout(() => setLocationToast(null), 5000);
                return;
              }
            }
          } catch (ipErr) {
            console.warn('[IP Location Fallback Failed]', ipErr);
          }
          setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'default');
        },
        { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    }
  }, [loadData, userProfile, initialCities]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSessionStorage(SESSION_KEYS.CITY, city);
    loadData(city, userProfile);
  };

  const handleProfileChange = (profile: UserProfile) => {
    setUserProfile(profile);
    setSessionStorage(SESSION_KEYS.PROFILE, profile);
    if (selectedCity) {
      loadData(selectedCity, profile);
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSessionStorage(SESSION_KEYS.ACTIVE_TAB, tab);
  };

  const handleToggleDrawer = () => {
    setIsFloatingChatOpen((prev) => {
      const next = !prev;
      setSessionStorage(SESSION_KEYS.DRAWER_OPEN, next);
      return next;
    });
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

      {/* Auto Location Toast Notification */}
      {locationToast && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-cyan-950/90 border-b border-cyan-500/40 px-4 py-2 text-center text-xs text-cyan-200 flex items-center justify-center gap-2 animate-fade-in backdrop-blur-md shadow-md z-40"
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
          <span className="font-medium">{locationToast}</span>
        </aside>
      )}

      {/* Tabs (Main navigation for monitor, routines, planner, indoor) */}
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

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
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            className="focus:outline-none"
          >
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
        onToggle={handleToggleDrawer}
      />

    </div>
  );
}

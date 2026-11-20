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

  // Initial location: Immediately use fast IP geolocation on site entry.
  // If browser already has GPS permission granted, silently refine coordinates.
  useEffect(() => {
    const calibrated = getSessionStorage<string | null>(SESSION_KEYS.LOCATION_CALIBRATED, null);
    if (calibrated) return;

    let isMounted = true;

    const calibrateInitialLocation = async () => {
      // 1. Instantly resolve via fast network IP geolocation (no permission prompt needed, 0ms lag)
      try {
        const ipRes = await fetch('/api/cities?ip=1');
        if (ipRes.ok && isMounted) {
          const ipData = await ipRes.json();
          if (ipData?.city) {
            const ipCity: City = ipData.city;
            setSelectedCity(ipCity.value);
            setSessionStorage(SESSION_KEYS.CITY, ipCity.value);
            setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'ip');
            loadData(ipCity.value, userProfile);
            const detectedName = ipData.detectedCity || ipCity.label;
            setLocationToast(`Auto-detected location: ${ipCity.label} (${detectedName})`);
            setTimeout(() => {
              if (isMounted) setLocationToast(null);
            }, 4500);
          }
        }
      } catch (err) {
        console.warn('[Initial IP Location failed]', err);
      }

      // 2. If browser ALREADY has GPS permission granted, silently refine without annoying prompts
      if (typeof window !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (perm.state === 'granted' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                if (!isMounted) return;
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
                      setLocationToast(`GPS refined: Connected to ${liveCity.label}`);
                      setTimeout(() => {
                        if (isMounted) setLocationToast(null);
                      }, 4000);
                      return;
                    }
                  }
                } catch {
                  // Keep the IP location already loaded
                }

                const { city: nearest } = findNearestCity(latitude, longitude, initialCities);
                setSelectedCity(nearest.value);
                setSessionStorage(SESSION_KEYS.CITY, nearest.value);
                setSessionStorage(SESSION_KEYS.LOCATION_CALIBRATED, 'gps');
                loadData(nearest.value, userProfile);
              },
              (gpsErr) => {
                // Silently ignore GPS error since IP location is already active
                console.warn('[Silent GPS check skipped]', gpsErr.message);
              },
              { timeout: 3500, enableHighAccuracy: false, maximumAge: 600000 }
            );
          }
        } catch {
          // Permissions API query not supported, keep IP location
        }
      }
    };

    calibrateInitialLocation();

    return () => {
      isMounted = false;
    };
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
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 pb-24 focus:outline-none">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
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

      {/* Accessible Footer aligned with Problem Statement standards */}
      <footer className="border-t border-slate-800/70 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 bg-slate-950/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            AirSense Environmental Diagnostics &copy; {new Date().getFullYear()}. Data sourced via Central Pollution Control Board (CPCB) CAAQMS & WAQI networks.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>NAAQS Aligned</span>
            <span>GRAP I-IV Protocols</span>
            <span>Gemini 3.5 Flash Powered</span>
          </div>
        </div>
      </footer>

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

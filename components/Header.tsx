'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { AQIData, City, UserProfile } from '@/lib/types';
import { ShieldAlert, MapPin, Users, Navigation, Search, X, Loader2, Check } from 'lucide-react';
import { findNearestCity, searchCities } from '@/lib/cities';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicCities, setDynamicCities] = useState<City[]>(cities);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active city object
  const currentCityObj = useMemo(() => {
    return (
      dynamicCities.find((c) => c.value.toLowerCase() === selectedCity.toLowerCase()) ||
      cities.find((c) => c.value.toLowerCase() === selectedCity.toLowerCase()) ||
      cities[0]
    );
  }, [cities, dynamicCities, selectedCity]);

  // Debounced live multi-source query across local catalog, WAQI search, and Open-Meteo geocoding
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setDynamicCities(cities);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            setDynamicCities(json);
          }
        }
      } catch (err) {
        console.warn('Dynamic multi-source search fallback:', err);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, cities]);

  // Filtered cities based on search input
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    return dynamicCities;
  }, [cities, dynamicCities, searchQuery]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  // Fallback to fast IP geolocation
  const fallbackToIpLocation = async (contextMsg: string) => {
    try {
      const res = await fetch('/api/cities?ip=1');
      if (res.ok) {
        const ipData = await res.json();
        if (ipData?.city) {
          onCityChange(ipData.city.value);
          setIsLocating(false);
          setIsSearchOpen(false);
          setSearchQuery('');
          const place = ipData.detectedCity || ipData.city.label;
          setLocationNotice(`${contextMsg}: ${ipData.city.label} (${place})`);
          setTimeout(() => setLocationNotice(null), 4500);
          return;
        }
      }
    } catch (e) {
      console.warn('IP fallback error:', e);
    }
    setIsLocating(false);
    setLocationNotice('Location unavailable. Please select your city from the list.');
    setTimeout(() => setLocationNotice(null), 4000);
  };

  // Auto-detect browser location with fast GPS check and seamless IP fallback
  const handleAutoDetectLocation = async () => {
    setIsLocating(true);
    setLocationNotice('Detecting location...');

    if (typeof window !== 'undefined' && navigator.geolocation) {
      let hasResolved = false;

      // 3.5-second safety fallback: if GPS stalls or hangs, smoothly auto-connect via IP
      const safetyFallbackTimer = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          fallbackToIpLocation('Connected via network IP');
        }
      }, 3500);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (hasResolved) return;
          hasResolved = true;
          clearTimeout(safetyFallbackTimer);

          const { latitude, longitude } = pos.coords;

          try {
            const res = await fetch(`/api/cities?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.city) {
                const liveStation: City = data.city;
                onCityChange(liveStation.value);
                setIsLocating(false);
                setIsSearchOpen(false);
                setSearchQuery('');
                const distanceText = data.distanceKm ? ` (~${data.distanceKm} km away)` : '';
                setLocationNotice(`GPS connected: ${liveStation.label}${distanceText}`);
                setTimeout(() => setLocationNotice(null), 4500);
                return;
              }
            }
          } catch (fetchErr) {
            console.warn('Live station resolution fallback:', fetchErr);
          }

          const { city: nearest, distanceKm } = findNearestCity(latitude, longitude, cities);
          onCityChange(nearest.value);
          setIsLocating(false);
          setIsSearchOpen(false);
          setSearchQuery('');
          setLocationNotice(`GPS connected: ${nearest.label} (~${distanceKm} km away)`);
          setTimeout(() => setLocationNotice(null), 4500);
        },
        (err) => {
          if (hasResolved) return;
          hasResolved = true;
          clearTimeout(safetyFallbackTimer);
          console.warn('[GPS unavailable or timed out, auto-resolving via IP]', err.message);
          fallbackToIpLocation('Auto-detected via network IP');
        },
        { timeout: 3500, enableHighAccuracy: false, maximumAge: 600000 }
      );
    } else {
      fallbackToIpLocation('Auto-detected via network IP');
    }
  };

  const handleSelectCity = (val: string) => {
    onCityChange(val);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800/80 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icon.svg"
              alt="AirSense Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl p-1 object-contain"
              priority
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">
                  AirSense
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
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto relative">
          {/* Searchable City Combobox with GPS Auto-Locate */}
          <div ref={dropdownRef} className="relative flex-1 sm:w-64">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:border-cyan-400 transition-all">
              {/* Trigger Button showing active city */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isSearchOpen}
                aria-label="Search and select city"
                className="flex items-center gap-2 px-2.5 py-1.5 text-left flex-1 min-w-0 cursor-pointer rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none"
              >
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-100 font-medium truncate">
                  {currentCityObj.label} {currentCityObj.state ? `(${currentCityObj.state})` : ''}
                </span>
              </button>

              {/* Auto GPS Location Detector Button */}
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isLocating}
                title="Auto-detect nearest city from browser location"
                aria-label="Auto-detect nearest city using browser GPS"
                className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Searchable Filter Popover Dropdown */}
            {isSearchOpen && (
              <div
                role="listbox"
                aria-label="Indian Cities List"
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-fade-in"
              >
                {/* Search Input Box */}
                <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, state, or region..."
                    aria-label="Filter Indian cities"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  {isSearchingRemote && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 flex-shrink-0" />
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Auto-detect GPS option item */}
                <div className="p-1.5 border-b border-slate-800/80 bg-slate-900/40">
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={isLocating}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20 transition-all cursor-pointer"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Auto-detect my current city via GPS</span>
                  </button>
                </div>

                {/* Filtered Cities Scrollable List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredCities.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No matching Indian cities found for &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredCities.map((city) => {
                      const isSelected = city.value.toLowerCase() === selectedCity.toLowerCase();
                      return (
                        <button
                          key={city.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectCity(city.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/50 text-cyan-300 font-bold border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{city.label}</span>
                            {city.state && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                                {city.state}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Selection */}
          <div className="relative flex-1 sm:w-56">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            <select
              value={userProfile}
              onChange={(e) => onProfileChange(e.target.value as UserProfile)}
              aria-label="Select Target Household Profile"
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

      {/* Floating Geolocation Toast Notification */}
      {locationNotice && (
        <div className="bg-cyan-950/90 border-t border-cyan-500/30 px-4 py-2 text-center text-xs text-cyan-200 animate-fade-in flex items-center justify-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>{locationNotice}</span>
        </div>
      )}
    </header>
  );
}

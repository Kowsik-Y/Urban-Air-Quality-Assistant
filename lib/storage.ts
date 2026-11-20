/**
 * AirSense Browser Session Storage Utilities
 * 
 * Safely accesses and manages window.sessionStorage with:
 * - SSR safety checks (typeof window !== 'undefined')
 * - JSON serialization / deserialization error handling
 * - Storage quota exception guards
 */

export const SESSION_KEYS = {
  CITY: 'airsense_session_city',
  PROFILE: 'airsense_session_profile',
  ACTIVE_TAB: 'airsense_session_active_tab',
  CHAT_MESSAGES: 'airsense_session_chat_messages',
  CHAT_HISTORY: 'airsense_session_chat_history',
  CHAT_SUGGESTIONS: 'airsense_session_chat_suggestions',
  DRAWER_OPEN: 'airsense_session_drawer_open',
  LOCATION_CALIBRATED: 'airsense_location_calibrated',
  TELEMETRY_PREFIX: 'airsense_cache_aqi_',
  RECS_PREFIX: 'airsense_cache_recs_',
} as const;

/**
 * Safely retrieves an item from sessionStorage.
 */
export function getSessionStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SessionStorage] Error reading key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely writes an item to sessionStorage.
 */
export function setSessionStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[SessionStorage] Error writing key "${key}":`, err);
  }
}

/**
 * Safely removes an item from sessionStorage.
 */
export function removeSessionStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SessionStorage] Error removing key "${key}":`, err);
  }
}

/**
 * Clears keys matching a prefix or resets all AirSense session items.
 */
export function clearAirSenseSession(prefix?: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (!prefix) {
      Object.values(SESSION_KEYS).forEach((k) => window.sessionStorage.removeItem(k));
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('[SessionStorage] Error clearing session:', err);
  }
}

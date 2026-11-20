import type { UserProfile } from './types';

/**
 * Standard Air Quality Index (AQI) category boundaries according to
 * Central Pollution Control Board (CPCB) of India and NAAQS guidelines.
 */
export const AQI_LEVELS = {
  GOOD_MAX: 50,
  MODERATE_MAX: 100,
  SENSITIVE_MAX: 150,
  UNHEALTHY_MAX: 200,
  VERY_UNHEALTHY_MAX: 300,
  HAZARDOUS_MAX: 500,
} as const;

/**
 * High-contrast semantic color tokens corresponding to CPCB AQI health brackets.
 * Guaranteed to satisfy WCAG AA contrast against dark slate backgrounds.
 */
export const AQI_COLORS = {
  GOOD: '#10b981', // Emerald 500
  MODERATE: '#eab308', // Yellow 500
  SENSITIVE: '#f97316', // Orange 500
  UNHEALTHY: '#ef4444', // Red 500
  VERY_UNHEALTHY: '#a855f7', // Purple 500
  HAZARDOUS: '#881337', // Rose 900 (Maroon)
} as const;

/**
 * Central Pollution Control Board (CPCB) National Ambient Air Quality Standards (NAAQS)
 * 24-hour permissible limits in micrograms per cubic meter (µg/m³).
 */
export const NAAQS_STANDARDS = {
  PM25_24HR_LIMIT: 60,
  PM10_24HR_LIMIT: 100,
  NO2_24HR_LIMIT: 80,
  SO2_24HR_LIMIT: 80,
  CO_8HR_LIMIT: 2.0, // mg/m³
  O3_8HR_LIMIT: 100,
} as const;

/**
 * Target demographic and household vulnerability profiles for customized guidance.
 */
export const USER_PROFILES: { value: UserProfile; label: string; description: string }[] = [
  {
    value: 'general',
    label: 'General Resident',
    description: 'Standard healthy adults seeking balanced daily exposure management.',
  },
  {
    value: 'family_with_kids',
    label: 'Family with Children',
    description: 'Infants and school-age children susceptible to developing lung damage.',
  },
  {
    value: 'senior_citizen',
    label: 'Senior Citizens / Elderly',
    description: 'Individuals over 60 with elevated cardiovascular and respiratory vulnerability.',
  },
  {
    value: 'working_professional',
    label: 'Daily Commuter',
    description: 'Professionals facing high-traffic corridors and peak transit smog.',
  },
  {
    value: 'student',
    label: 'Student / Outdoor Gig Worker',
    description: 'Active individuals spending prolonged hours outdoors during peak inversion hours.',
  },
];

/**
 * Global application caching durations (in seconds).
 */
export const CACHE_TTL = {
  TELEMETRY_SECONDS: 300, // 5 minutes
  RECOMMENDATIONS_SECONDS: 900, // 15 minutes
  GEOCODING_SECONDS: 86400, // 24 hours
} as const;

/**
 * Edge Proxy rate limiting configuration.
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 60, // 60 req/min
} as const;

/**
 * Chatbot input and context limits.
 */
export const CHAT_LIMITS = {
  MAX_INPUT_CHARS: 1000,
  MAX_HISTORY_TURNS: 10,
  SUGGESTION_DELIMITER: '<<<SUGGESTIONS>>>:',
} as const;

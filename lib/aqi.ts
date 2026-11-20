import { AQI_LEVELS, AQI_COLORS } from './constants';

export interface AQICategoryResult {
  category: string;
  color: string;
  healthMessage: string;
  level: number;
}

/**
 * Maps a numeric Air Quality Index (AQI) value to its official CPCB health category,
 * accessible semantic color code, actionable health guidance, and severity level (1-6).
 *
 * @param aqi - Numerical AQI integer (0-500+).
 * @returns Object with category name, hex color, health alert, and tier level.
 */
export function getAQICategory(aqi: number): AQICategoryResult {
  if (aqi <= AQI_LEVELS.GOOD_MAX) {
    return {
      category: 'Good',
      color: AQI_COLORS.GOOD,
      healthMessage: 'Air quality is satisfactory and poses little or no risk. Ideal for outdoor activities.',
      level: 1,
    };
  }
  if (aqi <= AQI_LEVELS.MODERATE_MAX) {
    return {
      category: 'Moderate',
      color: AQI_COLORS.MODERATE,
      healthMessage: 'Air quality is acceptable. Extremely sensitive people should consider limiting prolonged outdoor exertion.',
      level: 2,
    };
  }
  if (aqi <= AQI_LEVELS.SENSITIVE_MAX) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: AQI_COLORS.SENSITIVE,
      healthMessage: 'Members of sensitive groups (children, elderly, asthmatics) may experience health effects. General public not likely affected.',
      level: 3,
    };
  }
  if (aqi <= AQI_LEVELS.UNHEALTHY_MAX) {
    return {
      category: 'Unhealthy',
      color: AQI_COLORS.UNHEALTHY,
      healthMessage: 'Everyone may begin to experience health effects. Sensitive groups should avoid prolonged outdoor exertion.',
      level: 4,
    };
  }
  if (aqi <= AQI_LEVELS.VERY_UNHEALTHY_MAX) {
    return {
      category: 'Very Unhealthy',
      color: AQI_COLORS.VERY_UNHEALTHY,
      healthMessage: 'Health alert: The risk of health effects is increased for everyone. Strictly avoid outdoor exercise and wear N95 masks.',
      level: 5,
    };
  }
  return {
    category: 'Hazardous',
    color: AQI_COLORS.HAZARDOUS,
    healthMessage: 'Health warning of emergency conditions: The entire population is more likely to be severely affected. Remain indoors.',
    level: 6,
  };
}

export interface PollutantStatusResult {
  label: string;
  color: string;
}

/**
 * Evaluates raw criteria pollutant sensor concentration against Indian NAAQS and WHO thresholds.
 *
 * @param key - Pollutant identifier ('pm25', 'pm10', 'no2', 'so2', 'o3', 'co').
 * @param value - Measured concentration in micrograms per cubic meter (or mg/m³ for CO).
 * @returns Diagnostic status label and color badge.
 */
export function getPollutantStatus(
  key: string,
  value: number | null
): PollutantStatusResult {
  if (value === null || value === undefined) return { label: 'N/A', color: '#64748b' };

  // Breakpoints calibrated against Indian CPCB National Ambient Air Quality Standards (NAAQS)
  const thresholds: Record<string, [number, number, number]> = {
    pm25: [30, 60, 90],
    pm10: [50, 100, 250],
    no2: [40, 80, 180],
    so2: [40, 80, 380],
    o3: [50, 100, 168],
    co: [1.0, 2.0, 10.0],
  };

  const t = thresholds[key.toLowerCase()];
  if (!t) return { label: 'Normal', color: AQI_COLORS.GOOD };
  if (value <= t[0]) return { label: 'Good', color: AQI_COLORS.GOOD };
  if (value <= t[1]) return { label: 'Moderate', color: AQI_COLORS.MODERATE };
  if (value <= t[2]) return { label: 'Poor', color: AQI_COLORS.SENSITIVE };
  return { label: 'Severe', color: AQI_COLORS.UNHEALTHY };
}

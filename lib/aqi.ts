export function getAQICategory(aqi: number): {
  category: string;
  color: string;
  healthMessage: string;
  level: number;
} {
  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#10b981', // emerald-500
      healthMessage: 'Air quality is satisfactory and poses little or no risk. Ideal for outdoor activities.',
      level: 1,
    };
  }
  if (aqi <= 100) {
    return {
      category: 'Moderate',
      color: '#eab308', // yellow-500
      healthMessage: 'Air quality is acceptable. Extremely sensitive people should consider limiting prolonged outdoor exertion.',
      level: 2,
    };
  }
  if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: '#f97316', // orange-500
      healthMessage: 'Members of sensitive groups (children, elderly, asthmatics) may experience health effects. General public not likely affected.',
      level: 3,
    };
  }
  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      color: '#ef4444', // red-500
      healthMessage: 'Everyone may begin to experience health effects. Sensitive groups should avoid prolonged outdoor exertion.',
      level: 4,
    };
  }
  if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      color: '#a855f7', // purple-500
      healthMessage: 'Health alert: The risk of health effects is increased for everyone. Strictly avoid outdoor exercise and wear N95 masks.',
      level: 5,
    };
  }
  return {
    category: 'Hazardous',
    color: '#881337', // rose-900 / dark maroon
    healthMessage: 'Health warning of emergency conditions: The entire population is more likely to be severely affected. Remain indoors.',
    level: 6,
  };
}

export function getPollutantStatus(
  key: string,
  value: number | null
): { label: string; color: string } {
  if (value === null || value === undefined) return { label: 'N/A', color: '#64748b' };

  // Guidelines based on Indian CPCB / NAAQS & WHO 24hr breakpoints
  const thresholds: Record<string, [number, number, number]> = {
    pm25: [30, 60, 90],
    pm10: [50, 100, 250],
    no2: [40, 80, 180],
    so2: [40, 80, 380],
    o3: [50, 100, 168],
    co: [1.0, 2.0, 10.0],
  };

  const t = thresholds[key];
  if (!t) return { label: 'Normal', color: '#10b981' };
  if (value <= t[0]) return { label: 'Good', color: '#10b981' };
  if (value <= t[1]) return { label: 'Moderate', color: '#eab308' };
  if (value <= t[2]) return { label: 'Poor', color: '#f97316' };
  return { label: 'Severe', color: '#ef4444' };
}

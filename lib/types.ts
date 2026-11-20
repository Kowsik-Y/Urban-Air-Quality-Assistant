export interface AQIData {
  city: string;
  aqi: number;
  dominantPollutant: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null;
  timestamp: string;
  station: string;
  source: string;
  sourceUrl: string;
  category: string;
  color: string;
  healthMessage: string;
  level: number;
  isFallback?: boolean;
}

export interface Recommendation {
  title: string;
  description: string;
  impact: string;
  icon: string;
}

export interface Recommendations {
  urgencyMessage: string;
  healthAlert: string;
  lowEmissionRoutines: Recommendation[];
  indoorTips: Recommendation[];
  sustainableAlternatives: Recommendation[];
  dailyPlanner: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

export interface City {
  value: string;
  label: string;
  state?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export type UserProfile =
  | 'family_with_kids'
  | 'working_professional'
  | 'senior_citizen'
  | 'student'
  | 'general';

export type TabId = 'dashboard' | 'recommendations' | 'planner' | 'indoor' | 'chat';

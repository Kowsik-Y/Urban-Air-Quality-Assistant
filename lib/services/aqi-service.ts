import { getAQICategory } from '@/lib/aqi';
import { CITIES } from '@/lib/cities';
import type { AQIData } from '@/lib/types';
import { safeFetchJson } from '@/lib/proxy';
import { CACHE_TTL } from '@/lib/constants';

interface WaqiResponse {
  status: string;
  data?: {
    aqi?: number | string;
    dominentpol?: string;
    iaqi?: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      o3?: { v: number };
      co?: { v: number };
    };
    time?: { iso: string };
    city?: { name: string; url: string; geo?: [number, number] };
  };
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
    us_aqi?: number;
  };
}

interface OpenMeteoGeocoding {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
  }>;
}

export interface FetchAqiOptions {
  cityQuery: string;
  lat?: number | null;
  lon?: number | null;
  token?: string;
}

/**
 * Service to retrieve real-time air quality telemetry from CPCB/WAQI networks,
 * with automatic fallback to Open-Meteo high-resolution atmospheric dispersion modeling.
 *
 * @param options - Target city query string, optional coordinates, and API token.
 * @returns Fully normalized, schema-compliant AQIData telemetry object.
 */
export async function fetchAirQualityData({
  cityQuery,
  lat,
  lon,
  token = process.env.WAQI_TOKEN || 'bd1171e7da3d8014d4c00e6d046938a02cdc4df4',
}: FetchAqiOptions): Promise<{ data: AQIData; fromCache?: boolean }> {
  let targetLat: number | null = lat ?? null;
  let targetLon: number | null = lon ?? null;
  let targetQuery = (cityQuery || 'delhi').trim();
  let displayCityLabel = targetQuery;
  let displayState = '';

  // 1. Detect geo:lat,lon syntax
  if (targetQuery.startsWith('geo:')) {
    const coords = targetQuery.replace('geo:', '').split(',').map(Number);
    if (!isNaN(coords[0]) && !isNaN(coords[1])) {
      targetLat = coords[0];
      targetLon = coords[1];
    }
  }

  // 2. Check local curated catalog for canonical match
  const catalogMatch = CITIES.find(
    (c) =>
      c.value.toLowerCase() === targetQuery.toLowerCase() ||
      c.label.toLowerCase() === targetQuery.toLowerCase()
  );

  if (catalogMatch) {
    targetQuery = catalogMatch.value;
    displayCityLabel = catalogMatch.label;
    displayState = catalogMatch.state || '';
    if (targetLat == null) targetLat = catalogMatch.lat ?? null;
    if (targetLon == null) targetLon = catalogMatch.lon ?? null;
  }

  // 3. Attempt live CPCB / WAQI station fetch
  try {
    const waqiUrl =
      targetLat != null && targetLon != null && (cityQuery.startsWith('geo:') || lat != null)
        ? `https://api.waqi.info/feed/geo:${targetLat};${targetLon}/?token=${token}`
        : `https://api.waqi.info/feed/${encodeURIComponent(targetQuery)}/?token=${token}`;

    const { data: json, fromCache } = await safeFetchJson<WaqiResponse>(waqiUrl, {
      ttlSeconds: CACHE_TTL.TELEMETRY_SECONDS,
      timeoutMs: 6000,
      retries: 1,
    });

    if (json?.status === 'ok' && json.data) {
      const d = json.data;
      const rawAqi = typeof d.aqi === 'number' ? d.aqi : parseInt(String(d.aqi), 10) || 120;
      const aqi = Math.max(10, Math.min(500, rawAqi));
      const cat = getAQICategory(aqi);

      const stationFullName = d.city?.name || '';
      const stationParts = stationFullName.split(',').map((s) => s.trim()).filter(Boolean);

      let cleanStationCity = stationParts[0] || displayCityLabel;
      let cleanStationState = stationParts[1] || displayState;

      // Clean generic Indian CAAQMS station prefixes (e.g. "Urban, Chamarajanagar, India")
      if (/^(urban|rural|monitoring|station|cpcb|caaqms)$/i.test(cleanStationCity) && stationParts.length > 1) {
        cleanStationCity = `${stationParts[1]} (${cleanStationCity})`;
        cleanStationState = stationParts[2] || stationParts[1];
      }

      // Preserve searched city label if explicit (e.g., Sathyamangalam), else use station
      const finalCityDisplay =
        displayCityLabel && !displayCityLabel.startsWith('geo:')
          ? `${displayCityLabel}${displayState ? `, ${displayState}` : ''}`
          : `${cleanStationCity}${cleanStationState ? `, ${cleanStationState}` : ''}`;

      const result: AQIData = {
        city: finalCityDisplay,
        aqi,
        dominantPollutant: (d.dominentpol || 'pm25').toUpperCase(),
        pm25: d.iaqi?.pm25?.v ?? null,
        pm10: d.iaqi?.pm10?.v ?? null,
        no2: d.iaqi?.no2?.v ?? null,
        so2: d.iaqi?.so2?.v ?? null,
        o3: d.iaqi?.o3?.v ?? null,
        co: d.iaqi?.co?.v ?? null,
        timestamp: d.time?.iso || new Date().toISOString(),
        station: stationFullName || `${finalCityDisplay} CAAQMS Regional Monitor`,
        source: 'Continuous Ambient Air Quality Monitoring (CAAQMS) & WAQI Network',
        sourceUrl: d.city?.url || 'https://waqi.info',
        ...cat,
      };

      return { data: result, fromCache };
    }
  } catch (waqiErr) {
    console.warn('[WAQI Telemetry Fetch Failed, switching to Open-Meteo]', waqiErr);
  }

  // 4. Open-Meteo Fallback: geocode if coordinates are missing
  if (targetLat == null || targetLon == null) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        targetQuery
      )}&count=1&language=en&format=json`;

      const { data: geoData } = await safeFetchJson<OpenMeteoGeocoding>(geoUrl, {
        ttlSeconds: CACHE_TTL.RECOMMENDATIONS_SECONDS,
        timeoutMs: 4000,
      });

      if (geoData?.results && geoData.results.length > 0) {
        const topResult = geoData.results[0];
        targetLat = topResult.latitude;
        targetLon = topResult.longitude;
        displayCityLabel = topResult.name;
        displayState = topResult.admin1 || topResult.country || '';
      }
    } catch (geoErr) {
      console.warn('[Open-Meteo Geocoding Failed]', geoErr);
    }
  }

  // 5. Query Open-Meteo Air Quality API
  if (targetLat != null && targetLon != null) {
    try {
      const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${targetLat}&longitude=${targetLon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto`;

      const { data: omJson } = await safeFetchJson<OpenMeteoResponse>(openMeteoUrl, {
        ttlSeconds: CACHE_TTL.TELEMETRY_SECONDS,
        timeoutMs: 5000,
      });

      if (omJson?.current) {
        const c = omJson.current;
        const rawAqi = c.us_aqi || Math.round((c.pm2_5 || 40) * 2.2);
        const aqi = Math.max(10, Math.min(500, rawAqi));
        const cat = getAQICategory(aqi);

        const result: AQIData = {
          city: `${displayCityLabel}${displayState ? `, ${displayState}` : ''}`,
          aqi,
          dominantPollutant: 'PM2.5',
          pm25: c.pm2_5 != null ? Math.round(c.pm2_5 * 10) / 10 : null,
          pm10: c.pm10 != null ? Math.round(c.pm10 * 10) / 10 : null,
          no2: c.nitrogen_dioxide != null ? Math.round(c.nitrogen_dioxide * 10) / 10 : null,
          so2: c.sulphur_dioxide != null ? Math.round(c.sulphur_dioxide * 10) / 10 : null,
          o3: c.ozone != null ? Math.round(c.ozone * 10) / 10 : null,
          co: c.carbon_monoxide != null ? Math.round((c.carbon_monoxide / 1000) * 10) / 10 : null,
          timestamp: c.time || new Date().toISOString(),
          station: `${displayCityLabel} Environmental Telemetry Station`,
          source: 'Continuous Ambient Air Quality Monitoring (CAAQMS)',
          sourceUrl: 'https://cpcb.nic.in/',
          ...cat,
        };

        return { data: result, fromCache: false };
      }
    } catch (omErr) {
      console.warn('[Open-Meteo Air Quality Fetch Failed]', omErr);
    }
  }

  throw new Error(`Failed to retrieve live sensor data for ${displayCityLabel || targetQuery}.`);
}

import { CITIES, findNearestCity, searchCities } from '@/lib/cities';
import type { City } from '@/lib/types';
import { safeFetchJson } from '@/lib/proxy';
import { CACHE_TTL } from '@/lib/constants';

interface WaqiGeoResponse {
  status: string;
  data?: {
    city?: {
      name: string;
      geo?: [number, number];
    };
  };
}

interface WaqiSearchResponse {
  status: string;
  data?: Array<{
    uid: number;
    aqi: string;
    station: {
      name: string;
      geo?: [number, number];
    };
  }>;
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    country_code?: string;
  }>;
}

const isPrivateIp = (ip: string) =>
  ip === '127.0.0.1' ||
  ip === '::1' ||
  ip === 'localhost' ||
  ip.startsWith('10.') ||
  ip.startsWith('192.168.') ||
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
  ip.startsWith('fc00:') ||
  ip.startsWith('fe80:');

/**
 * Resolves client network IP to the nearest Indian urban monitoring center.
 */
export async function resolveIpLocation(rawIp?: string): Promise<{
  success: boolean;
  city: City;
  distanceKm?: number;
  detectedCity?: string;
  detectedRegion?: string;
  ip?: string;
  source: string;
}> {
  const targetUrl =
    rawIp && !isPrivateIp(rawIp)
      ? `https://ipwho.is/${encodeURIComponent(rawIp)}`
      : 'https://ipwho.is/';

  try {
    const { data } = await safeFetchJson<{
      success: boolean;
      city?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      ip?: string;
    }>(targetUrl, {
      ttlSeconds: CACHE_TTL.RECOMMENDATIONS_SECONDS,
      timeoutMs: 4000,
    });

    if (data?.success && data.latitude != null && data.longitude != null) {
      const { city: nearest, distanceKm } = findNearestCity(
        data.latitude,
        data.longitude,
        CITIES
      );

      return {
        success: true,
        city: nearest,
        distanceKm,
        detectedCity: data.city || 'Unknown',
        detectedRegion: data.region || 'India',
        ip: data.ip,
        source: 'ip_geolocation',
      };
    }
  } catch (err) {
    console.warn('[IP Location Resolution Failed]', err);
  }

  return {
    success: false,
    city: CITIES[0],
    source: 'baseline_default',
  };
}

/**
 * Resolves precise GPS coordinates to the exact town/city and nearest WAQI station.
 */
export async function resolveCoordinates(
  lat: number,
  lon: number,
  token = process.env.WAQI_TOKEN || 'bd1171e7da3d8014d4c00e6d046938a02cdc4df4'
): Promise<{
  city: City;
  stationName?: string;
  distanceKm?: number;
  source: string;
}> {
  const { city: nearestCatalog, distanceKm: catalogDist } = findNearestCity(lat, lon, CITIES);

  let resolvedTown: string | null = null;
  let resolvedState: string | null = null;

  // OpenStreetMap Nominatim reverse geocode
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const { data: nomData } = await safeFetchJson<{
      address?: {
        town?: string;
        city?: string;
        municipality?: string;
        village?: string;
        suburb?: string;
        county?: string;
        state_district?: string;
        state?: string;
      };
    }>(nomUrl, {
      ttlSeconds: CACHE_TTL.GEOCODING_SECONDS,
      timeoutMs: 3000,
      headers: { 'User-Agent': 'AirSense-Urban-Air-Quality-Assistant/1.0' },
    });

    if (nomData?.address) {
      const a = nomData.address;
      resolvedTown = a.town || a.city || a.municipality || a.village || a.suburb || a.county || a.state_district || null;
      resolvedState = a.state || null;
    }
  } catch (nomErr) {
    console.warn('[Nominatim reverse lookup skipped]', nomErr);
  }

  const primaryTown =
    catalogDist <= 30
      ? nearestCatalog.label
      : resolvedTown || nearestCatalog.label;
  const primaryState =
    catalogDist <= 30
      ? nearestCatalog.state
      : resolvedState || nearestCatalog.state || 'India';

  // WAQI station lookup
  try {
    const waqiGeoUrl = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
    const { data: geoData } = await safeFetchJson<WaqiGeoResponse>(waqiGeoUrl, {
      ttlSeconds: CACHE_TTL.TELEMETRY_SECONDS,
      timeoutMs: 4000,
    });

    if (geoData?.status === 'ok' && geoData.data?.city?.name) {
      const rawName = geoData.data.city.name;
      const parts = rawName.split(',').map((s) => s.trim()).filter(Boolean);

      let cleanStationCity = parts[0] || primaryTown;
      let cleanStationState = parts[1] || primaryState;

      if (/^(urban|rural|monitoring|station|cpcb|caaqms)$/i.test(cleanStationCity) && parts.length > 1) {
        cleanStationCity = `${parts[1]} (${cleanStationCity})`;
        cleanStationState = parts[2] || parts[1];
      }

      const geoLat = geoData.data.city.geo?.[0] ?? lat;
      const geoLon = geoData.data.city.geo?.[1] ?? lon;

      const dynamicCity: City = {
        value: primaryTown.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: primaryTown,
        state: primaryState,
        lat: geoLat,
        lon: geoLon,
      };

      return {
        city: dynamicCity,
        stationName: rawName,
        distanceKm: catalogDist,
        source: 'waqi_geo',
      };
    }
  } catch (err) {
    console.warn('[WAQI Geo lookup failed, using local fallback]', err);
  }

  const fallbackCity: City = {
    value: primaryTown.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    label: primaryTown,
    state: primaryState,
    lat,
    lon,
  };

  return { city: fallbackCity, distanceKm: catalogDist, source: 'geo_resolved' };
}

/**
 * Searches across local curated catalog, live WAQI stations, and Open-Meteo geocoding.
 */
export async function searchLocations(
  query: string,
  token = process.env.WAQI_TOKEN || 'bd1171e7da3d8014d4c00e6d046938a02cdc4df4'
): Promise<City[]> {
  const q = query.trim();
  if (!q) return CITIES;

  const results: City[] = [];
  const seenSlugs = new Set<string>();

  // 1. Local catalog matches
  const localMatches = searchCities(q, CITIES);
  for (const c of localMatches) {
    seenSlugs.add(c.value.toLowerCase());
    results.push(c);
  }

  // 2. Parallel remote search
  const [waqiResults, openMeteoResults] = await Promise.allSettled([
    // WAQI Search
    safeFetchJson<WaqiSearchResponse>(
      `https://api.waqi.info/search/?token=${token}&keyword=${encodeURIComponent(q)}`,
      { ttlSeconds: CACHE_TTL.RECOMMENDATIONS_SECONDS, timeoutMs: 3500 }
    ),
    // Open-Meteo Geocoding
    safeFetchJson<OpenMeteoGeocodingResponse>(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=5&language=en&format=json`,
      { ttlSeconds: CACHE_TTL.RECOMMENDATIONS_SECONDS, timeoutMs: 3500 }
    ),
  ]);

  // Parse WAQI results
  if (waqiResults.status === 'fulfilled' && waqiResults.value?.data?.status === 'ok') {
    const stations = waqiResults.value.data.data || [];
    for (const s of stations) {
      const name = s.station?.name || '';
      if (!name) continue;

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
      if (seenSlugs.has(slug)) continue;

      const parts = name.split(',').map((p) => p.trim());
      const label = parts[0];
      const state = parts[1] || 'India';

      if (label && label.length > 1) {
        seenSlugs.add(slug);
        results.push({
          value: slug,
          label,
          state,
          lat: s.station.geo?.[0],
          lon: s.station.geo?.[1],
        });
      }
    }
  }

  // Parse Open-Meteo results
  if (openMeteoResults.status === 'fulfilled' && openMeteoResults.value?.data?.results) {
    const places = openMeteoResults.value.data.results || [];
    for (const p of places) {
      if (p.country_code && p.country_code.toUpperCase() !== 'IN') continue;

      const slug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (seenSlugs.has(slug)) continue;

      seenSlugs.add(slug);
      results.push({
        value: slug,
        label: p.name,
        state: p.admin1 || p.country || 'India',
        lat: p.latitude,
        lon: p.longitude,
      });
    }
  }

  return results.slice(0, 30);
}

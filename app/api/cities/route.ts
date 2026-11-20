import { NextRequest, NextResponse } from 'next/server';
import { CITIES, findNearestCity, searchCities } from '@/lib/cities';
import { safeFetchJson } from '@/lib/proxy';
import type { City } from '@/lib/types';

export const runtime = 'nodejs';

interface WaqiSearchResult {
  status: string;
  data?: Array<{
    uid: number;
    aqi: string | number;
    station: {
      name: string;
      geo?: [number, number];
      url?: string;
    };
  }>;
}

interface OpenMeteoGeocodingResult {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

interface WaqiGeoResponse {
  status: string;
  data?: {
    city?: {
      name?: string;
      geo?: [number, number];
      url?: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const isIpRequest = searchParams.get('ip') === '1';

  const token = process.env.WAQI_TOKEN || 'bd1171e7da3d8014d4c00e6d046938a02cdc4df4';

  // 1. Resolve location from client IP address
  if (isIpRequest) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip')?.trim();
    const rawIp = forwarded || realIp || '';

    const isPrivateIp = (ip: string) =>
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
      ip.startsWith('fc00:') ||
      ip.startsWith('fe80:');

    const targetUrl = rawIp && !isPrivateIp(rawIp)
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
        ttlSeconds: 900,
        timeoutMs: 4000,
      });

      if (data?.success && data.latitude != null && data.longitude != null) {
        const { city: nearest, distanceKm } = findNearestCity(
          data.latitude,
          data.longitude,
          CITIES
        );

        return NextResponse.json({
          success: true,
          city: nearest,
          distanceKm,
          detectedCity: data.city || 'Unknown',
          detectedRegion: data.region || 'India',
          ip: data.ip,
          source: 'ip_geolocation',
        });
      }
    } catch (err) {
      console.warn('[IP Location Resolution Failed]', err);
    }

    return NextResponse.json({
      success: false,
      city: CITIES[0],
      source: 'baseline_default',
    });
  }

  // 1. Resolve exact nearest monitoring station from GPS coordinates
  if (latStr && lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (!isNaN(lat) && !isNaN(lon)) {
      // 1A. Check local catalog proximity first (e.g., Sathyamangalam, Coimbatore, Erode)
      const { city: nearestCatalog, distanceKm: catalogDist } = findNearestCity(lat, lon, CITIES);

      // 1B. Reverse geocode with OpenStreetMap Nominatim for exact local municipality/town
      let resolvedTown: string | null = null;
      let resolvedState: string | null = null;

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
          ttlSeconds: 86400,
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

      // If catalog distance is within 30km, prefer curated catalog label for clean UI
      const primaryTown =
        catalogDist <= 30
          ? nearestCatalog.label
          : resolvedTown || nearestCatalog.label;
      const primaryState =
        catalogDist <= 30
          ? nearestCatalog.state
          : resolvedState || nearestCatalog.state || 'India';

      // 1C. Query nearest WAQI live sensor station
      try {
        const waqiGeoUrl = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
        const { data: geoData } = await safeFetchJson<WaqiGeoResponse>(waqiGeoUrl, {
          ttlSeconds: 600,
          timeoutMs: 4000,
        });

        if (geoData?.status === 'ok' && geoData.data?.city?.name) {
          const rawName = geoData.data.city.name;
          const parts = rawName.split(',').map((s) => s.trim()).filter(Boolean);

          let cleanStationCity = parts[0] || primaryTown;
          let cleanStationState = parts[1] || primaryState;

          // Prevent generic 'Urban' or 'Rural' from being used as the city label
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

          return NextResponse.json({
            city: dynamicCity,
            stationName: rawName,
            distanceKm: catalogDist,
            source: 'waqi_geo',
          });
        }
      } catch (err) {
        console.warn('[WAQI Geo lookup failed, falling back to local nearest]', err);
      }

      // Fallback: return resolved town or nearest catalog city
      const fallbackCity: City = {
        value: primaryTown.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: primaryTown,
        state: primaryState,
        lat,
        lon,
      };

      return NextResponse.json({ city: fallbackCity, distanceKm: catalogDist, source: 'geo_resolved' });
    }
  }

  // 2. If no query, return pre-cached curated cities
  if (!q) {
    return NextResponse.json(CITIES);
  }

  // 3. Search dynamically across local catalog and live external sources
  const results: City[] = [];
  const seenSlugs = new Set<string>();

  // A. Local catalog matches first (instant)
  const localMatches = searchCities(q, CITIES);
  for (const c of localMatches) {
    const slug = c.value.toLowerCase();
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      results.push(c);
    }
  }

  // B. Query Open-Meteo Global Geocoding API for any city or town name
  try {
    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=10&language=en&format=json`;
    const { data: geoData } = await safeFetchJson<OpenMeteoGeocodingResult>(openMeteoUrl, {
      ttlSeconds: 600,
      timeoutMs: 3500,
    });

    if (geoData?.results) {
      for (const item of geoData.results) {
        const slug = item.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        if (!seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          results.push({
            value: slug,
            label: item.name,
            state: item.admin1 || item.country || 'India',
            lat: Math.round(item.latitude * 10000) / 10000,
            lon: Math.round(item.longitude * 10000) / 10000,
          });
        }
      }
    }
  } catch (geoErr) {
    console.warn('[Open-Meteo Geocoding failed]', geoErr);
  }

  // C. Query WAQI Search API for live CAAQMS air quality station keywords
  try {
    const waqiSearchUrl = `https://api.waqi.info/search/?keyword=${encodeURIComponent(q)}&token=${token}`;
    const { data: waqiData } = await safeFetchJson<WaqiSearchResult>(waqiSearchUrl, {
      ttlSeconds: 600,
      timeoutMs: 3500,
    });

    if (waqiData?.status === 'ok' && waqiData.data) {
      for (const item of waqiData.data.slice(0, 8)) {
        const stationName = item.station.name;
        const mainLabel = stationName.split(',')[0].trim();
        const stateName = stationName.split(',')[1]?.trim() || '';
        const slug = mainLabel.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        if (!seenSlugs.has(slug) && item.station.geo) {
          seenSlugs.add(slug);
          results.push({
            value: slug,
            label: mainLabel,
            state: stateName || 'CAAQMS Station',
            lat: item.station.geo[0],
            lon: item.station.geo[1],
          });
        }
      }
    }
  } catch (waqiErr) {
    console.warn('[WAQI Station search failed]', waqiErr);
  }

  return NextResponse.json(results);
}

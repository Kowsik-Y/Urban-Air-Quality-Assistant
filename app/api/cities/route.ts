import { NextRequest, NextResponse } from 'next/server';
import { CITIES } from '@/lib/cities';
import {
  resolveIpLocation,
  resolveCoordinates,
  searchLocations,
} from '@/lib/services/geo-service';

export const runtime = 'nodejs';

/**
 * GET /api/cities
 * Multi-source dynamic location endpoint supporting:
 * - ?ip=1: Network IP geolocation
 * - ?lat=..&lon=..: GPS coordinates to exact town & CAAQMS station
 * - ?q=..: Multi-source parallel search (Catalog + WAQI + Open-Meteo)
 * - (empty): Curated baseline Indian urban centers
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const isIpRequest = searchParams.get('ip') === '1';

  // 1. IP Geolocation request
  if (isIpRequest) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip')?.trim();
    const result = await resolveIpLocation(forwarded || realIp);
    return NextResponse.json(result);
  }

  // 2. Coordinate resolution request
  if (latStr && lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!isNaN(lat) && !isNaN(lon)) {
      const result = await resolveCoordinates(lat, lon);
      return NextResponse.json(result);
    }
  }

  // 3. Search query request
  if (q && q.trim()) {
    const results = await searchLocations(q);
    return NextResponse.json(results);
  }

  // 4. Default: curated baseline catalog
  return NextResponse.json(CITIES);
}

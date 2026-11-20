import { NextRequest, NextResponse } from 'next/server';
import { fetchAirQualityData } from '@/lib/services/aqi-service';

export const runtime = 'nodejs';

/**
 * GET /api/aqi
 * Live criteria pollutant resolver for Indian urban centers.
 * Supports city names, slugs, and GPS coordinates (geo:lat,lon).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawCity = searchParams.get('city') || 'delhi';
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  const lat = latParam ? parseFloat(latParam) : null;
  const lon = lonParam ? parseFloat(lonParam) : null;

  try {
    const { data, fromCache } = await fetchAirQualityData({
      cityQuery: rawCity,
      lat: !isNaN(Number(lat)) ? lat : null,
      lon: !isNaN(Number(lon)) ? lon : null,
    });

    const response = NextResponse.json(data);
    response.headers.set('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=60'
    );
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sensor telemetry unavailable.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

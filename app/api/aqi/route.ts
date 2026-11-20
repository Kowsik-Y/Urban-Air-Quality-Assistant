import { NextRequest, NextResponse } from 'next/server';
import { getAQICategory } from '@/lib/aqi';
import type { AQIData } from '@/lib/types';

interface WAQIResponse {
  status: string;
  data: {
    aqi: number | string;
    dominentpol?: string;
    city?: { name: string; url?: string };
    time?: { s: string; iso: string };
    iaqi?: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      o3?: { v: number };
      co?: { v: number };
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim() || 'delhi';

  const token = process.env.WAQI_TOKEN || 'demo';
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // Cache 5 min
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `WAQI server responded with HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const json: WAQIResponse = await res.json();

    if (json.status !== 'ok' || !json.data) {
      return NextResponse.json(
        { error: `No live station data for "${city}". Please try another Indian city.` },
        { status: 404 }
      );
    }

    const d = json.data;
    const aqi = typeof d.aqi === 'number' ? d.aqi : parseInt(String(d.aqi), 10);

    if (isNaN(aqi) || aqi <= 0) {
      return NextResponse.json(
        { error: `Current station in ${city} is recalibrating sensors.` },
        { status: 404 }
      );
    }

    const cat = getAQICategory(aqi);

    const result: AQIData = {
      city: d.city?.name ?? city.toUpperCase(),
      aqi,
      dominantPollutant: (d.dominentpol || 'pm25').toUpperCase(),
      pm25: d.iaqi?.pm25?.v ?? null,
      pm10: d.iaqi?.pm10?.v ?? null,
      no2: d.iaqi?.no2?.v ?? null,
      so2: d.iaqi?.so2?.v ?? null,
      o3: d.iaqi?.o3?.v ?? null,
      co: d.iaqi?.co?.v ?? null,
      timestamp: d.time?.iso || d.time?.s || new Date().toISOString(),
      station: d.city?.name ?? `${city} Central Monitoring Station`,
      source: 'World Air Quality Index & CPCB Network',
      sourceUrl: d.city?.url ?? 'https://waqi.info',
      ...cat,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[AQI API Error]', err);
    return NextResponse.json(
      { error: 'Failed to connect to air quality monitoring servers.' },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { safeFetchJson, isAllowedUrl, ProxySecurityError, getProxyCacheStats } from '@/lib/proxy';

export const runtime = 'nodejs';

/**
 * AirSense Secure Proxy Endpoint
 * GET /api/proxy?url=<encoded_url>
 * 
 * Verifies URL against authorized domain allowlist and forwards request
 * with SSRF defense, caching, and rate limiting.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (searchParams.get('stats') === '1') {
    return NextResponse.json(getProxyCacheStats());
  }

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Bad Request: "url" query parameter is mandatory.' },
      { status: 400 }
    );
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    
    if (!isAllowedUrl(decodedUrl)) {
      return NextResponse.json(
        { error: 'Forbidden: Requested destination is not in the authorized proxy allowlist.' },
        { status: 403 }
      );
    }

    const { data, fromCache } = await safeFetchJson<unknown>(decodedUrl, {
      ttlSeconds: 300,
      timeoutMs: 7000,
    });

    const response = NextResponse.json(data);
    response.headers.set('X-Proxy-Cache', fromCache ? 'HIT' : 'MISS');
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return response;
  } catch (err: unknown) {
    if (err instanceof ProxySecurityError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Proxy dispatch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

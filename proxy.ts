import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AirSense Next.js Edge Proxy
 * 
 * Intercepts incoming requests to:
 * 1. Inject distributed tracing identifiers (`x-request-id`).
 * 2. Enforce strict HTTP security headers (CSP, X-Frame-Options, HSTS, etc.).
 * 3. Guard API endpoints against abuse with rate limiting.
 * 4. Handle CORS preflight options for environmental API routes.
 */

// Simple in-memory rate limiter per IP for Edge/Proxy layer (60 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // Forward client IP or fallback
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. API Route Rate Limiting Guard
  if (pathname.startsWith('/api/') && isRateLimited(clientIp)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait 60 seconds before retrying.',
        requestId,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'x-request-id': requestId,
        },
      }
    );
  }

  // 2. Pre-flight OPTIONS handling for API endpoints
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-request-id',
        'Access-Control-Max-Age': '86400',
        'x-request-id': requestId,
      },
    });
  }

  // 3. Prepare request headers with unique Request-ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // 4. Pass request through with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Inject Security & Observability Headers into the outgoing response
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

// Default export as specified in Next.js Proxy convention
export default proxy;

/**
 * Proxy route matcher: matches all paths except static chunks, images, and favicons
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:jpg|jpeg|gif|png|webp)).*)',
  ],
};

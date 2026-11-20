/**
 * AirSense Enterprise Proxy & Resilient HTTP Client
 * 
 * Provides:
 * 1. SSRF Guard: Whitelists allowed external domains and enforces HTTPS.
 * 2. In-Memory TTL Cache: Avoids redundant external calls and respects API quotas.
 * 3. Timeout & Abort Handling: Safeguards against hanging upstream connections.
 * 4. Exponential Backoff Retries: Recovers smoothly from transient network hiccups.
 * 5. Header Sanitization: Prevents credential and cookie leakage across proxy requests.
 */

const ALLOWED_DOMAINS = new Set([
  'api.waqi.info',
  'air-quality-api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'ipwho.is',
  'cpcb.nic.in',
  'generativelanguage.googleapis.com',
]);

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  headers?: Record<string, string>;
}

interface ProxyStats {
  hits: number;
  misses: number;
  cachedEntries: number;
}

// In-memory LRU / TTL store for external API calls
const memoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_SIZE = 500;

let cacheHits = 0;
let cacheMisses = 0;

export interface ProxyOptions extends RequestInit {
  timeoutMs?: number;
  ttlSeconds?: number;
  retries?: number;
  skipCache?: boolean;
}

export class ProxySecurityError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'ProxySecurityError';
    this.statusCode = statusCode;
  }
}

/**
 * Validates a target URL against the domain allowlist and HTTPS protocol to prevent SSRF attacks.
 */
export function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

/**
 * Sanitizes headers to prevent secret leaks across proxied boundaries.
 */
function sanitizeHeaders(inputHeaders?: HeadersInit): Headers {
  const headers = new Headers(inputHeaders);
  headers.delete('cookie');
  headers.delete('proxy-authorization');
  headers.set('User-Agent', 'AirSense-UrbanAssistant/1.0 (+https://github.com)');
  return headers;
}

/**
 * Fetches JSON safely through the proxy layer with caching, retries, and SSRF validation.
 */
export async function safeFetchJson<T>(
  targetUrl: string,
  options: ProxyOptions = {}
): Promise<{ data: T; fromCache: boolean; status: number }> {
  const {
    timeoutMs = 8000,
    ttlSeconds = 300,
    retries = 2,
    skipCache = false,
    ...fetchOptions
  } = options;

  // 1. SSRF & Protocol Validation
  if (!isAllowedUrl(targetUrl)) {
    throw new ProxySecurityError(
      `Access denied: Target URL host is not in the authorized environmental proxy allowlist.`
    );
  }

  // 2. Check in-memory cache
  const cacheKey = `${fetchOptions.method || 'GET'}:${targetUrl}`;
  if (!skipCache && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey) as CacheEntry<T>;
    if (Date.now() < entry.expiresAt) {
      cacheHits++;
      return { data: entry.data, fromCache: true, status: 200 };
    }
    memoryCache.delete(cacheKey);
  }

  cacheMisses++;

  // 3. Resilient Fetch Loop with Exponential Backoff
  let lastError: Error | null = null;
  const headers = sanitizeHeaders(fetchOptions.headers);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(targetUrl, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Upstream server returned HTTP ${response.status}`);
      }

      const json = (await response.json()) as T;

      // 4. Cache valid result if TTL specified
      if (ttlSeconds > 0 && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
        if (memoryCache.size >= MAX_CACHE_SIZE) {
          const firstKey = memoryCache.keys().next().value;
          if (firstKey) memoryCache.delete(firstKey);
        }
        memoryCache.set(cacheKey, {
          data: json,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }

      return { data: json, fromCache: false, status: response.status };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 3000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error(`Proxy request to ${targetUrl} failed after ${retries} retries.`);
}

/**
 * Returns proxy performance and cache telemetry.
 */
export function getProxyCacheStats(): ProxyStats {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    cachedEntries: memoryCache.size,
  };
}

/**
 * Clears the in-memory proxy cache.
 */
export function clearProxyCache(): void {
  memoryCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

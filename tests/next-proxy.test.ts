import { describe, it } from 'node:test';
import assert from 'node:assert';
import { proxy } from '../proxy';
import { NextRequest } from 'next/server';

describe('Next.js Proxy Handler (proxy.ts)', () => {
  it('injects x-request-id and security headers onto outgoing responses', () => {
    const req = new NextRequest('http://localhost:3000/api/cities');
    const res = proxy(req);

    assert.ok(res.headers.get('x-request-id'), 'Response must have an x-request-id header');
    assert.strictEqual(res.headers.get('X-Frame-Options'), 'DENY');
    assert.strictEqual(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.strictEqual(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
    assert.strictEqual(res.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=(self)');
  });

  it('handles CORS OPTIONS preflight queries for API routes', () => {
    const req = new NextRequest('http://localhost:3000/api/aqi', {
      method: 'OPTIONS',
    });
    const res = proxy(req);

    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.match(res.headers.get('Access-Control-Allow-Methods') || '', /POST/);
  });
});

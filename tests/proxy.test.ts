import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { isAllowedUrl, clearProxyCache, getProxyCacheStats } from '../lib/proxy';

describe('Proxy SSRF Security Validation', () => {
  it('permits authorized environmental API hosts over HTTPS', () => {
    assert.strictEqual(
      isAllowedUrl('https://api.waqi.info/feed/delhi/?token=xyz'),
      true
    );
    assert.strictEqual(
      isAllowedUrl('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.6&longitude=77.2'),
      true
    );
    assert.strictEqual(
      isAllowedUrl('https://cpcb.nic.in/current-aqi'),
      true
    );
    assert.strictEqual(
      isAllowedUrl('https://generativelanguage.googleapis.com/v1beta/models'),
      true
    );
  });

  it('rejects unauthorized external hosts to prevent SSRF', () => {
    assert.strictEqual(isAllowedUrl('https://malicious-site.com/steal-keys'), false);
    assert.strictEqual(isAllowedUrl('https://example.com/api'), false);
    assert.strictEqual(isAllowedUrl('https://attacker.io/leak'), false);
  });

  it('rejects non-HTTPS protocols strictly', () => {
    assert.strictEqual(isAllowedUrl('http://api.waqi.info/feed/delhi/'), false);
    assert.strictEqual(isAllowedUrl('file:///etc/passwd'), false);
    assert.strictEqual(isAllowedUrl('gopher://cpcb.nic.in'), false);
    assert.strictEqual(isAllowedUrl('ftp://air-quality-api.open-meteo.com'), false);
  });

  it('rejects internal loopback and private network probes', () => {
    assert.strictEqual(isAllowedUrl('https://127.0.0.1:8080'), false);
    assert.strictEqual(isAllowedUrl('https://localhost:3000'), false);
    assert.strictEqual(isAllowedUrl('https://169.254.169.254/latest/meta-data'), false);
    assert.strictEqual(isAllowedUrl('https://192.168.1.1/admin'), false);
  });

  it('handles malformed and non-URL inputs safely', () => {
    assert.strictEqual(isAllowedUrl(''), false);
    assert.strictEqual(isAllowedUrl('not-a-valid-url'), false);
    assert.strictEqual(isAllowedUrl('javascript:alert(1)'), false);
  });
});

describe('Proxy In-Memory Cache Telemetry', () => {
  beforeEach(() => {
    clearProxyCache();
  });

  it('resets cache statistics cleanly', () => {
    const stats = getProxyCacheStats();
    assert.strictEqual(stats.hits, 0);
    assert.strictEqual(stats.misses, 0);
    assert.strictEqual(stats.cachedEntries, 0);
  });
});

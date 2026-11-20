import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isAllowedUrl } from '../lib/proxy';

describe('IP Geolocation Security & Allowlist', () => {
  it('permits authorized ipwho.is host over HTTPS', () => {
    assert.strictEqual(isAllowedUrl('https://ipwho.is/'), true);
    assert.strictEqual(isAllowedUrl('https://ipwho.is/45.127.110.99'), true);
  });

  it('rejects unverified and insecure IP lookup services', () => {
    assert.strictEqual(isAllowedUrl('http://ipwho.is/'), false);
    assert.strictEqual(isAllowedUrl('https://untrusted-ip-api.com/json'), false);
  });
});

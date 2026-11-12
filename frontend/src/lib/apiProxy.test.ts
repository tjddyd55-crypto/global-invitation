import assert from 'node:assert/strict';
import test from 'node:test';
import config from '../../next.config';

test('general API proxy preserves the dedicated admin proxy and supports all API env aliases', async () => {
  const keys = ['ADMIN_API_PROXY_TARGET', 'NEXT_PUBLIC_ADMIN_API_BASE_URL', 'NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_BACKEND_URL', 'NEXT_PUBLIC_API_URL'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    assert.ok(config.rewrites);
    const rewrites = config.rewrites;
    for (const key of keys) delete process.env[key];
    assert.deepEqual(await rewrites(), []);
    process.env.ADMIN_API_PROXY_TARGET = 'https://admin.example';
    for (const key of keys.slice(2)) {
      process.env[key] = 'https://backend.example/';
      assert.deepEqual(await rewrites(), [
        { source: '/api/admin/:path*', destination: 'https://admin.example/api/admin/:path*' },
        { source: '/api/:path*', destination: 'https://backend.example/api/:path*' },
      ]);
      delete process.env[key];
    }
    process.env.NEXT_PUBLIC_API_BASE_URL = 'file:///invalid';
    const invalidRules = await rewrites();
    assert.ok(Array.isArray(invalidRules));
    assert.equal(invalidRules.length, 1);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

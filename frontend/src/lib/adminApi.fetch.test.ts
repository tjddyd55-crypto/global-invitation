/**
 * Unit: adminApiFetch always sends credentials:include to absolute backend URL.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

test('adminApiFetch forces credentials include and absolute backend URL', async () => {
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL = 'https://backend-development-c9a4.up.railway.app';

  const calls: Array<{ url: string; init: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init || {} });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    // Dynamic import after env is set so getAdminApiBaseUrl sees the value.
    const { adminApiFetch } = await import('./adminApi');
    await adminApiFetch('/api/admin/me', {
      method: 'GET',
      credentials: 'omit',
    });

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      'https://backend-development-c9a4.up.railway.app/api/admin/me'
    );
    assert.equal(calls[0].init.credentials, 'include');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
  }
});

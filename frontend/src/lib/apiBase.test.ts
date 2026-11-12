import assert from 'node:assert/strict';
import test from 'node:test';

test('API URLs remain absolute on the server and first-party in the browser', async () => {
  const previousBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://backend.example/';
  try {
    const { buildApiUrl, buildRequestInit } = await import('./apiBase');
    assert.equal(buildApiUrl('/api/auth/me'), 'https://backend.example/api/auth/me');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
    assert.equal(buildApiUrl('api/auth/login'), '/api/auth/login');
    assert.equal(buildApiUrl('/api/invitations'), '/api/invitations');
    assert.equal(buildApiUrl('/api/admin/me'), '/api/admin/me');
    delete (globalThis as { window?: unknown }).window;
    assert.equal(buildRequestInit().credentials, 'include');
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete (globalThis as { window?: unknown }).window;
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousBase;
  }
});

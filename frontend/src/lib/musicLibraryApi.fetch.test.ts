/**
 * fetchMusicLibrary must attach Bearer like other editor APIs (cross-origin cookie alone is not enough).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

test('fetchMusicLibrary sends Authorization Bearer via buildAuthHeaders', async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://backend.test';

  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: globalThis,
  });
  store.set(
    'auth_session_v1',
    JSON.stringify({
      token: 'test-session-token',
      user: { id: 'u1', email: 'a@b.c', name: null },
      expiresAt: Date.now() + 60_000,
    })
  );

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const { fetchMusicLibrary } = await import('./musicLibraryApi');
    await fetchMusicLibrary({ concept: 'GENERAL' });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/music-library\?concept=GENERAL/);
    const headers = new Headers(calls[0].init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer test-session-token');
    assert.equal(calls[0].init?.credentials, 'include');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

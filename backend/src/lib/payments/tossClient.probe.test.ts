import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectTossKeyEnvironmentMismatch,
  probeTossCredentials,
} from './tossClient';

test('detectTossKeyEnvironmentMismatch flags live keys in TEST', () => {
  const result = detectTossKeyEnvironmentMismatch(
    'TEST',
    'live_ck_demo',
    'live_sk_demo'
  );
  assert.equal(result?.code, 'TOSS_ENVIRONMENT_MISMATCH');
});

test('detectTossKeyEnvironmentMismatch allows matching TEST keys', () => {
  assert.equal(
    detectTossKeyEnvironmentMismatch('TEST', 'test_ck_demo', 'test_sk_demo'),
    null
  );
});

test('probeTossCredentials returns invalid on 401', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"code":"UNAUTHORIZED"}', { status: 401 })) as typeof fetch;
  try {
    const result = await probeTossCredentials('test_sk_fixture');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'TOSS_CREDENTIALS_INVALID');
  } finally {
    globalThis.fetch = original;
  }
});

test('probeTossCredentials returns ok on non-auth HTTP (auth accepted)', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"code":"NOT_FOUND_PAYMENT"}', { status: 404 })) as typeof fetch;
  try {
    const result = await probeTossCredentials('test_sk_fixture');
    assert.equal(result.ok, true);
    assert.equal(result.code, 'TOSS_AUTH_OK');
  } finally {
    globalThis.fetch = original;
  }
});

test('probeTossCredentials returns timeout on abort', async () => {
  const originalFetch = globalThis.fetch;
  const prevTimeout = process.env.TOSS_PROBE_TIMEOUT_MS;
  process.env.TOSS_PROBE_TIMEOUT_MS = '20';
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    return await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
  }) as typeof fetch;
  try {
    const result = await probeTossCredentials('test_sk_fixture');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'TOSS_API_TIMEOUT');
  } finally {
    globalThis.fetch = originalFetch;
    if (prevTimeout === undefined) delete process.env.TOSS_PROBE_TIMEOUT_MS;
    else process.env.TOSS_PROBE_TIMEOUT_MS = prevTimeout;
  }
});

test('probe response never includes secret', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response('{}', { status: 404 })) as typeof fetch;
  try {
    const result = await probeTossCredentials('super_secret_value_should_not_leak');
    assert.doesNotMatch(JSON.stringify(result), /super_secret_value_should_not_leak/);
  } finally {
    globalThis.fetch = original;
  }
});

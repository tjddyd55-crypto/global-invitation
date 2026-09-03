import assert from 'node:assert/strict';
import test from 'node:test';
import { probeFigmaCredentials } from './client';

test('probeFigmaCredentials returns invalid on 401', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"status":401}', { status: 401 })) as typeof fetch;
  try {
    const result = await probeFigmaCredentials('figd_fixture_token');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'FIGMA_TOKEN_INVALID');
  } finally {
    globalThis.fetch = original;
  }
});

test('probeFigmaCredentials returns scope insufficient on 403', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"status":403}', { status: 403 })) as typeof fetch;
  try {
    const result = await probeFigmaCredentials('figd_fixture_token');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'FIGMA_SCOPE_INSUFFICIENT');
  } finally {
    globalThis.fetch = original;
  }
});

test('probeFigmaCredentials returns ok on 404 (auth accepted for file API)', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"status":404}', { status: 404 })) as typeof fetch;
  try {
    const result = await probeFigmaCredentials('figd_fixture_token');
    assert.equal(result.ok, true);
    assert.equal(result.code, 'FIGMA_AUTH_OK');
  } finally {
    globalThis.fetch = original;
  }
});

test('probeFigmaCredentials uses X-Figma-Token header', async () => {
  const original = globalThis.fetch;
  let capturedHeader = '';
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string> | undefined;
    capturedHeader = headers?.['X-Figma-Token'] || '';
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  try {
    await probeFigmaCredentials('  figd_fixture_token  ');
    assert.equal(capturedHeader, 'figd_fixture_token');
  } finally {
    globalThis.fetch = original;
  }
});

test('probe response never includes token', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response('{}', { status: 404 })) as typeof fetch;
  try {
    const result = await probeFigmaCredentials('figd_super_secret_should_not_leak');
    assert.doesNotMatch(JSON.stringify(result), /figd_super_secret_should_not_leak/);
  } finally {
    globalThis.fetch = original;
  }
});

test('probeFigmaCredentials returns timeout on abort', async () => {
  const original = globalThis.fetch;
  const prevTimeout = process.env.FIGMA_PROBE_TIMEOUT_MS;
  process.env.FIGMA_PROBE_TIMEOUT_MS = '20';
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
    const result = await probeFigmaCredentials('figd_fixture_token');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'FIGMA_API_TIMEOUT');
  } finally {
    globalThis.fetch = original;
    if (prevTimeout === undefined) delete process.env.FIGMA_PROBE_TIMEOUT_MS;
    else process.env.FIGMA_PROBE_TIMEOUT_MS = prevTimeout;
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request } from 'express';
import { resolveSessionToken } from './auth';

function mockRequest(headers: Record<string, string>): Request {
  return { headers, cookies: undefined } as Request;
}

test('resolveSessionToken prefers cookie over bearer', () => {
  const req = mockRequest({
    cookie: 'auth_session_token=cookie-token',
    authorization: 'Bearer bearer-token',
  });
  (req as Request & { headers: { cookie?: string } }).headers.cookie =
    'auth_session_token=cookie-token';
  const token = resolveSessionToken(req);
  assert.equal(token, 'cookie-token');
});

test('resolveSessionToken uses bearer when cookie absent', () => {
  const req = mockRequest({
    authorization: 'Bearer native-session-token',
  });
  const token = resolveSessionToken(req);
  assert.equal(token, 'native-session-token');
});

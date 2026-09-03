import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapTossConnectionErrorCode,
  missingCredentialsConnectionResult,
  normalizeTossConnectionTestResult,
} from './tossConnectionTest';

test('normalize success payload ignores English backend message and uses Korean success copy', () => {
  const result = normalizeTossConnectionTestResult('TEST', 200, {
    ok: true,
    code: 'TOSS_AUTH_OK',
    message: 'raw english',
    verification: 'toss_api_auth',
  });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'success');
  assert.match(result.message, /TEST API 인증 연결/);
});

test('normalize treats HTTP 200 with ok:false as failure', () => {
  const result = normalizeTossConnectionTestResult('TEST', 200, {
    ok: false,
    code: 'TOSS_CREDENTIALS_INVALID',
  });
  assert.equal(result.ok, false);
  assert.equal(result.type, 'error');
  assert.match(result.message, /인증 키가 올바르지 않습니다/);
});

test('normalize maps HTTP 401 failure code', () => {
  const result = normalizeTossConnectionTestResult('LIVE', 401, {
    ok: false,
    code: 'TOSS_CREDENTIALS_INVALID',
    error: 'TOSS_CREDENTIALS_INVALID',
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /LIVE Client Key/);
});

test('normalize maps timeout and unreachable', () => {
  assert.match(
    normalizeTossConnectionTestResult('TEST', 504, { ok: false, code: 'TOSS_API_TIMEOUT' }).message,
    /응답 시간/
  );
  assert.match(
    normalizeTossConnectionTestResult('TEST', 502, { ok: false, code: 'TOSS_API_UNREACHABLE' }).message,
    /서버 연결/
  );
});

test('missing credentials local result', () => {
  const result = missingCredentialsConnectionResult('TEST');
  assert.equal(result.code, 'PROVIDER_CREDENTIALS_INCOMPLETE');
  assert.match(result.message, /먼저 저장/);
});

test('mapTossConnectionErrorCode falls back with code', () => {
  assert.match(mapTossConnectionErrorCode('UNKNOWN_X', 'TEST'), /UNKNOWN_X/);
});

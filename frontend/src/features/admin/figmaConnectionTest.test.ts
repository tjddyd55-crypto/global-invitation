import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatFigmaScopeHelper,
  mapFigmaConnectionErrorCode,
  missingFigmaTokenConnectionResult,
  normalizeFigmaConnectionTestResult,
} from './figmaConnectionTest';

test('normalize success uses Korean success copy', () => {
  const result = normalizeFigmaConnectionTestResult(200, {
    ok: true,
    code: 'FIGMA_AUTH_OK',
    verification: 'figma_file_api_auth',
  });
  assert.equal(result.ok, true);
  assert.match(result.message, /Figma API 인증 연결/);
});

test('normalize maps invalid token', () => {
  const result = normalizeFigmaConnectionTestResult(401, {
    ok: false,
    code: 'FIGMA_TOKEN_INVALID',
    error: 'FIGMA_TOKEN_INVALID',
  });
  assert.match(result.message, /유효하지 않습니다/);
});

test('normalize maps insufficient scope', () => {
  const result = normalizeFigmaConnectionTestResult(403, {
    ok: false,
    code: 'FIGMA_SCOPE_INSUFFICIENT',
  });
  assert.match(result.message, /권한이 부족합니다/);
  assert.match(result.message, /file_content:read/);
});

test('missing token local result', () => {
  const result = missingFigmaTokenConnectionResult();
  assert.equal(result.code, 'FIGMA_TOKEN_NOT_CONFIGURED');
});

test('scope helper lists runtime import scopes only', () => {
  const helper = formatFigmaScopeHelper();
  assert.match(helper, /file_content:read/);
  assert.match(helper, /file_metadata:read/);
  assert.doesNotMatch(helper, /current_user:read/);
});

test('mapFigmaConnectionErrorCode falls back with code', () => {
  assert.match(mapFigmaConnectionErrorCode('UNKNOWN_X'), /UNKNOWN_X/);
});

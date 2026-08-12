import assert from 'node:assert/strict';
import test from 'node:test';
import { mapMusicLibraryErrorMessage } from './musicLibraryApi';

test('mapMusicLibraryErrorMessage never returns raw AUTH_REQUIRED', () => {
  const message = mapMusicLibraryErrorMessage({ status: 401, code: 'AUTH_REQUIRED' });
  assert.doesNotMatch(message, /AUTH_REQUIRED/);
  assert.match(message, /새로고침/);
});

test('mapMusicLibraryErrorMessage maps network/server failures', () => {
  const message = mapMusicLibraryErrorMessage({
    status: 500,
    code: 'MUSIC_LIBRARY_INTERNAL_ERROR',
  });
  assert.doesNotMatch(message, /MUSIC_LIBRARY_INTERNAL_ERROR|INTERNAL_ERROR/);
  assert.match(message, /잠시 후/);
});

test('mapMusicLibraryErrorMessage strips raw fallback codes', () => {
  const message = mapMusicLibraryErrorMessage({
    status: null,
    code: null,
    fallback: 'AUTH_REQUIRED',
  });
  assert.equal(message.includes('AUTH_REQUIRED'), false);
  assert.match(message, /음악 목록/);
});

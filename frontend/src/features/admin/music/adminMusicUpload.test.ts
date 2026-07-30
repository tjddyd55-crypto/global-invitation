import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatMusicDuration,
  mapConfirmMusicError,
  resolveAdminTrackPlayability,
  validateAdminMusicFile,
} from './adminMusicUpload';

test('rejects tiny placeholder files before upload', () => {
  const tiny = new File([new Uint8Array(2048)], 'fake.mp3', { type: 'audio/mpeg' });
  assert.equal(
    validateAdminMusicFile(tiny),
    '파일이 너무 작아 재생 가능한 음원으로 볼 수 없습니다.'
  );
});

test('maps invalid audio confirm codes to Korean guidance', () => {
  assert.match(mapConfirmMusicError('AUDIO_DURATION_INVALID'), /재생 가능한 음악 파일/);
});

test('formats missing duration as unverified', () => {
  assert.equal(formatMusicDuration(null), '확인 불가');
  assert.equal(formatMusicDuration(222), '03:42');
});

test('marks tiny tracks as suspicious', () => {
  assert.equal(
    resolveAdminTrackPlayability({ fileSize: 2048, durationSeconds: null }),
    'suspicious'
  );
  assert.equal(
    resolveAdminTrackPlayability({ fileSize: 200_000, durationSeconds: 12 }),
    'ok'
  );
});

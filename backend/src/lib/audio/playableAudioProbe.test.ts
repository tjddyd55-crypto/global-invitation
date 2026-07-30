import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MIN_PLAYABLE_AUDIO_BYTES,
  PlayableAudioProbeError,
  probePlayableAudio,
} from './playableAudioProbe';

function buildFakeMpegStub(size = 2048): Buffer {
  const buffer = Buffer.alloc(size, 0);
  // MPEG sync + bitrate nibble — looks like audio/mpeg to naive checkers.
  buffer[0] = 0xff;
  buffer[1] = 0xfb;
  buffer[2] = 0x90;
  buffer[3] = 0x00;
  return buffer;
}

test('rejects files smaller than minimum playable size', async () => {
  await assert.rejects(
    () => probePlayableAudio(buildFakeMpegStub(2048), 'audio/mpeg'),
    (error: unknown) =>
      error instanceof PlayableAudioProbeError && error.code === 'AUDIO_FILE_TOO_SMALL'
  );
});

test('rejects padded fake MPEG without duration/stream', async () => {
  const padded = buildFakeMpegStub(MIN_PLAYABLE_AUDIO_BYTES);
  await assert.rejects(
    () => probePlayableAudio(padded, 'audio/mpeg'),
    (error: unknown) =>
      error instanceof PlayableAudioProbeError &&
      (error.code === 'INVALID_AUDIO_FILE' ||
        error.code === 'AUDIO_DURATION_INVALID' ||
        error.code === 'AUDIO_STREAM_NOT_FOUND')
  );
});

test('rejects HTML disguised as mp3', async () => {
  const html = Buffer.concat([
    Buffer.from('<!DOCTYPE html><html><body>not audio</body></html>'),
    Buffer.alloc(MIN_PLAYABLE_AUDIO_BYTES, 0x20),
  ]);
  await assert.rejects(
    () => probePlayableAudio(html, 'audio/mpeg'),
    (error: unknown) => error instanceof PlayableAudioProbeError
  );
});

test('rejects unsupported mime', async () => {
  await assert.rejects(
    () => probePlayableAudio(Buffer.alloc(MIN_PLAYABLE_AUDIO_BYTES, 1), 'text/plain'),
    (error: unknown) =>
      error instanceof PlayableAudioProbeError && error.code === 'UNSUPPORTED_AUDIO_TYPE'
  );
});

test('accepts a real MP3 with positive duration', async () => {
  const samplePath = `${process.env.TEMP || '/tmp'}/qa-real-sample.mp3`;
  let buffer: Buffer;
  try {
    const fs = await import('node:fs');
    buffer = fs.readFileSync(samplePath);
  } catch {
    // Local fixture optional outside CI machines that downloaded the sample.
    return;
  }
  if (buffer.length < MIN_PLAYABLE_AUDIO_BYTES) return;
  const result = await probePlayableAudio(buffer, 'audio/mpeg');
  assert.ok(result.durationSeconds > 0);
  assert.ok(result.codec);
});

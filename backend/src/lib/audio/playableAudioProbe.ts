import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/** Placeholder / stub audio (e.g. 2KB fake MPEG header) must never enter the library. */
export const MIN_PLAYABLE_AUDIO_BYTES = 16 * 1024;

const ALLOWED_PROBE_MIME = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

export type PlayableAudioProbeResult = {
  durationSeconds: number;
  codec: string | null;
  container: string | null;
  sampleRate: number | null;
  bitrate: number | null;
};

export class PlayableAudioProbeError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'PlayableAudioProbeError';
  }
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'audio/mpeg') return '.mp3';
  if (mimeType === 'audio/aac') return '.aac';
  return '.m4a';
}

function hasMpegFrameSync(buffer: Buffer): boolean {
  let syncCount = 0;
  const limit = Math.min(buffer.length - 1, 256 * 1024);
  for (let index = 0; index < limit; index += 1) {
    if (buffer[index] === 0xff && (buffer[index + 1] & 0xe0) === 0xe0) {
      syncCount += 1;
      if (syncCount >= 2) return true;
    }
  }
  return syncCount >= 1 && buffer.length >= MIN_PLAYABLE_AUDIO_BYTES;
}

function looksLikeId3(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0x49 &&
    buffer[1] === 0x44 &&
    buffer[2] === 0x33
  );
}

function looksLikeMp4Family(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const box = buffer.subarray(4, 8).toString('ascii');
  return box === 'ftyp' || box === 'moov' || box === 'mdat';
}

function hasPlausibleAudioSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'audio/mpeg') {
    return looksLikeId3(buffer) || hasMpegFrameSync(buffer);
  }
  if (mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a' || mimeType === 'audio/aac') {
    return looksLikeMp4Family(buffer) || hasMpegFrameSync(buffer) || looksLikeId3(buffer);
  }
  return false;
}

function countNonZeroBytes(buffer: Buffer): number {
  let count = 0;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  for (const byte of sample) {
    if (byte !== 0) count += 1;
  }
  return count;
}

async function parseAudioMetadata(buffer: Buffer, mimeType: string) {
  // Dynamic import: music-metadata@11 is ESM; Railway/Node CJS dist must not require() it.
  // parseFile via temp path avoids parseBuffer MIME guess failures seen in this runtime.
  const { parseFile } = await import('music-metadata');
  const tempPath = path.join(
    os.tmpdir(),
    `invite-audio-probe-${crypto.randomUUID()}${extensionForMime(mimeType)}`
  );
  await fs.writeFile(tempPath, buffer);
  try {
    return await parseFile(tempPath, { duration: true });
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

/**
 * Probe uploaded bytes for a real, decodable audio stream with positive duration.
 * Signature alone is never enough — duration/stream metadata must succeed.
 */
export async function probePlayableAudio(
  buffer: Buffer,
  mimeType: string
): Promise<PlayableAudioProbeResult> {
  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_PROBE_MIME.has(normalizedMime)) {
    throw new PlayableAudioProbeError('UNSUPPORTED_AUDIO_TYPE');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length <= 0) {
    throw new PlayableAudioProbeError('INVALID_AUDIO_FILE');
  }
  if (buffer.length < MIN_PLAYABLE_AUDIO_BYTES) {
    throw new PlayableAudioProbeError('AUDIO_FILE_TOO_SMALL');
  }
  if (!hasPlausibleAudioSignature(buffer, normalizedMime)) {
    throw new PlayableAudioProbeError('INVALID_AUDIO_FILE');
  }
  // Reject near-empty payloads that only carry a forged MPEG sync word.
  if (countNonZeroBytes(buffer) < 64) {
    throw new PlayableAudioProbeError('INVALID_AUDIO_FILE');
  }

  let metadata;
  try {
    metadata = await parseAudioMetadata(buffer, normalizedMime);
  } catch {
    throw new PlayableAudioProbeError('INVALID_AUDIO_FILE');
  }

  const duration = metadata.format.duration;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
    throw new PlayableAudioProbeError('AUDIO_DURATION_INVALID');
  }

  const hasStreamHint = Boolean(
    metadata.format.codec ||
      metadata.format.container ||
      metadata.format.sampleRate ||
      metadata.format.numberOfChannels ||
      (metadata.format.codecProfile && metadata.format.codecProfile.length > 0)
  );
  if (!hasStreamHint) {
    throw new PlayableAudioProbeError('AUDIO_STREAM_NOT_FOUND');
  }

  return {
    durationSeconds: Math.max(1, Math.round(duration)),
    codec: metadata.format.codec || null,
    container: metadata.format.container || null,
    sampleRate: metadata.format.sampleRate ?? null,
    bitrate: metadata.format.bitrate ?? null,
  };
}

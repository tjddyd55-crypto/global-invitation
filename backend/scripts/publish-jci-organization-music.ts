/**
 * JCI Organization 공용 BGM 2곡 → R2 shared + InvitationMusicTrack 등록.
 *
 * 기존 SSOT:
 *   invitation/shared/music/{common|wedding|funeral|general}/{uuid}.mp3
 *   ORGANIZATION concept → GENERAL music category (Prisma enum 미확장)
 *
 * 사용법 (development, 로컬에서 public DB 필요):
 *   # 1) public DATABASE_URL + R2 env 준비
 *   node scripts/prepare-temp-media-runtime-env.cjs
 *   # 2) env 로드 후 실행 (Windows PowerShell 예시 — 값은 로그하지 말 것)
 *   # Get-Content ../artifacts/temp-media-verification/.env.runtime | ...
 *   npx tsx scripts/publish-jci-organization-music.ts
 *   npx tsx scripts/publish-jci-organization-music.ts --dry-run
 *
 * `railway run` 은 내부 DB 호스트를 주입하므로 로컬 머신에서는 사용하지 않는다.
 *
 * 로컬 절대 경로는 이 스크립트 CLI 입력에만 쓰이며 runtime/FE 코드에 남지 않는다.
 */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { InvitationMusicCategory } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { buildSharedAssetKey, getInvitationAssetPublicUrl } from '../src/lib/invitationAssetKeys';
import { r2Client, resolveR2Config } from '../src/lib/storage/r2Client';
import { MIN_PLAYABLE_AUDIO_BYTES } from '../src/lib/audio/playableAudioProbe';
import { MAX_SHARED_MUSIC_BYTES } from '../src/services/invitationMusicLibraryService';

type TrackPlan = {
  /** Stable logical id for idempotent re-runs (stored in description tag). */
  logicalId: string;
  title: string;
  sourceFileName: string;
  sortOrder: number;
};

const TRACKS: TrackPlan[] = [
  {
    logicalId: 'JCI_CREED_SONG',
    title: 'JCI Creed Song',
    sourceFileName: 'JCI CREED SONG.mp3',
    sortOrder: 1,
  },
  {
    logicalId: 'JCI_CREED_SONG_2',
    title: 'JCI Creed Song 2',
    sourceFileName: 'JCI CREED SONG 2.mp3',
    sortOrder: 2,
  },
];

const SOURCE_DIR_DEFAULT = path.resolve(process.cwd(), '..', 'logo');
const MIME = 'audio/mpeg';
const CATEGORY = InvitationMusicCategory.GENERAL;

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const sourceIdx = argv.indexOf('--source-dir');
  const sourceDir =
    sourceIdx >= 0 && argv[sourceIdx + 1] ? path.resolve(argv[sourceIdx + 1]) : SOURCE_DIR_DEFAULT;
  return { dryRun, sourceDir };
}

async function probeLocalMp3(filePath: string) {
  const stat = await fs.stat(filePath);
  const meta = await parseFile(filePath);
  const durationSeconds = Math.round(meta.format.duration || 0);
  const bitrate = meta.format.bitrate || null;
  if (!durationSeconds || durationSeconds <= 0) {
    throw new Error(`INVALID_DURATION:${filePath}`);
  }
  if (stat.size < MIN_PLAYABLE_AUDIO_BYTES) {
    throw new Error(`AUDIO_FILE_TOO_SMALL:${filePath}`);
  }
  if (stat.size > MAX_SHARED_MUSIC_BYTES) {
    throw new Error(`FILE_TOO_LARGE:${filePath}`);
  }
  return {
    bytes: stat.size,
    durationSeconds,
    bitrate,
    sampleRate: meta.format.sampleRate || null,
    channels: meta.format.numberOfChannels || null,
    codec: meta.format.codec || null,
  };
}

async function findExistingByLogicalId(logicalId: string) {
  return prisma.invitationMusicTrack.findFirst({
    where: {
      category: CATEGORY,
      description: { contains: `logicalId=${logicalId}` },
      isArchived: false,
    },
  });
}

async function main() {
  const { dryRun, sourceDir } = parseArgs(process.argv.slice(2));
  resolveR2Config();

  const results: Array<Record<string, unknown>> = [];

  for (const track of TRACKS) {
    const sourcePath = path.join(sourceDir, track.sourceFileName);
    const probe = await probeLocalMp3(sourcePath);
    const buffer = await fs.readFile(sourcePath);
    const sha256 = createHash('sha256').update(buffer).digest('hex');

    const existing = await findExistingByLogicalId(track.logicalId);
    if (existing) {
      results.push({
        logicalId: track.logicalId,
        status: 'already_registered',
        objectKey: existing.objectKey,
        publicUrl: existing.publicUrl,
        trackId: existing.id,
        bytes: existing.fileSize,
        durationSeconds: existing.durationSeconds,
        sha256,
      });
      continue;
    }

    const fileKey = randomUUID();
    const objectKey = buildSharedAssetKey({
      kind: 'music',
      concept: 'general',
      fileKey,
      contentType: MIME,
      filename: `${track.logicalId.toLowerCase()}.mp3`,
    });
    const publicUrl = getInvitationAssetPublicUrl(objectKey);

    if (!dryRun) {
      const r2 = resolveR2Config();
      await r2Client.send(
        new PutObjectCommand({
          Bucket: r2.bucketName,
          Key: objectKey,
          Body: buffer,
          ContentType: MIME,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      const created = await prisma.invitationMusicTrack.create({
        data: {
          title: track.title,
          artistName: 'JCI',
          description: `JCI 행사 추천 | logicalId=${track.logicalId}`,
          category: CATEGORY,
          originalFilename: `${track.logicalId.toLowerCase().replace(/_/g, '-')}.mp3`,
          objectKey,
          publicUrl,
          mimeType: MIME,
          fileSize: probe.bytes,
          durationSeconds: probe.durationSeconds,
          sortOrder: track.sortOrder,
          isActive: true,
          isArchived: false,
          // Operator-provided shared catalog asset (not end-user upload).
          commercialUseConfirmed: true,
          licenseType: 'operator_provided',
          licenseSource: 'operator',
          attributionRequired: false,
          attributionText: null,
        },
      });

      results.push({
        logicalId: track.logicalId,
        status: 'uploaded',
        trackId: created.id,
        objectKey,
        publicUrl,
        bytes: probe.bytes,
        durationSeconds: probe.durationSeconds,
        bitrate: probe.bitrate,
        sha256,
      });
    } else {
      results.push({
        logicalId: track.logicalId,
        status: 'dry_run',
        objectKey,
        publicUrl,
        bytes: probe.bytes,
        durationSeconds: probe.durationSeconds,
        bitrate: probe.bitrate,
        sha256,
      });
    }
  }

  console.log(JSON.stringify({ dryRun, sourceDir, category: CATEGORY, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

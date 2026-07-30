import crypto from 'crypto';
import { InvitationMusicCategory, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  buildSharedAssetKey,
  getInvitationAssetPublicUrl,
  type InvitationSharedConcept,
} from '../lib/invitationAssetKeys';
import {
  MIN_PLAYABLE_AUDIO_BYTES,
  PlayableAudioProbeError,
  probePlayableAudio,
} from '../lib/audio/playableAudioProbe';
import { createPresignedUploadUrl, deleteObject, getObjectBuffer, headObject } from '../lib/media/r2';
import type {
  AdminTrackFilters,
  ConfirmSharedMusicInput,
  SharedMusicPresignMeta,
  UpdateTrackInput,
  ValidatedTrackCreateParams,
} from './invitationMusicLibraryTypes';

export type {
  AdminTrackFilters,
  ConfirmSharedMusicInput,
  SharedMusicPresignMeta,
  UpdateTrackInput,
} from './invitationMusicLibraryTypes';

export const MAX_SHARED_MUSIC_BYTES = 20 * 1024 * 1024;
export { MIN_PLAYABLE_AUDIO_BYTES };
export const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

const CATEGORY_CONCEPT: Record<InvitationMusicCategory, InvitationSharedConcept> = {
  COMMON: 'common',
  WEDDING: 'wedding',
  FUNERAL: 'funeral',
  GENERAL: 'general',
};
const CATEGORY_VALUES = new Set(Object.values(InvitationMusicCategory));
const PUBLIC_TRACK_SELECT = {
  id: true,
  title: true,
  artistName: true,
  category: true,
  publicUrl: true,
  durationSeconds: true,
  attributionText: true,
  attributionRequired: true,
} satisfies Prisma.InvitationMusicTrackSelect;

export class InvitationMusicLibraryError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
    this.name = 'InvitationMusicLibraryError';
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return normalizeText(value) || null;
}

function requireText(value: unknown, code: string): string {
  const normalized = normalizeText(value);
  if (!normalized) throw new InvitationMusicLibraryError(code, 400);
  return normalized;
}

function requireInteger(value: unknown, code: string, minimum = 0): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new InvitationMusicLibraryError(code, 400);
  }
  return parsed;
}

function requireCategory(value: unknown): InvitationMusicCategory {
  const normalized = normalizeText(value).toUpperCase();
  if (!CATEGORY_VALUES.has(normalized as InvitationMusicCategory)) {
    throw new InvitationMusicLibraryError('INVALID_MUSIC_CATEGORY', 400);
  }
  return normalized as InvitationMusicCategory;
}

function requireAudioType(value: unknown): string {
  const normalized = normalizeText(value).toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(normalized)) {
    throw new InvitationMusicLibraryError('UNSUPPORTED_AUDIO_TYPE', 400);
  }
  return normalized;
}

function requireFileSize(value: unknown): number {
  const size = requireInteger(value, 'INVALID_FILE_SIZE', 1);
  if (size < MIN_PLAYABLE_AUDIO_BYTES) {
    throw new InvitationMusicLibraryError('AUDIO_FILE_TOO_SMALL', 400);
  }
  if (size > MAX_SHARED_MUSIC_BYTES) {
    throw new InvitationMusicLibraryError('FILE_TOO_LARGE', 400);
  }
  return size;
}

export function mapMusicCategoryToConcept(
  category: InvitationMusicCategory
): InvitationSharedConcept {
  return CATEGORY_CONCEPT[requireCategory(category)];
}

export function buildPublicCategoryFilter(
  concept?: Exclude<InvitationMusicCategory, 'COMMON'>
): InvitationMusicCategory[] | undefined {
  if (!concept) return undefined;
  const category = requireCategory(concept);
  if (category === InvitationMusicCategory.COMMON) {
    throw new InvitationMusicLibraryError('INVALID_MUSIC_CONCEPT', 400);
  }
  return [InvitationMusicCategory.COMMON, category];
}

function assertSharedMusicObjectKey(
  objectKey: string,
  category: InvitationMusicCategory,
  mimeType: string
): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const matched = normalized.match(
    /^invitation\/shared\/music\/(common|wedding|funeral|general)\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.[a-z0-9]+$/i
  );
  if (!matched || matched[1] !== mapMusicCategoryToConcept(category)) {
    throw new InvitationMusicLibraryError('INVALID_SHARED_MUSIC_OBJECT_KEY', 400);
  }
  const canonical = buildSharedAssetKey({
    kind: 'music',
    concept: matched[1] as InvitationSharedConcept,
    fileKey: matched[2],
    contentType: mimeType,
  });
  if (canonical !== normalized) {
    throw new InvitationMusicLibraryError('INVALID_SHARED_MUSIC_OBJECT_KEY', 400);
  }
  return normalized;
}

export async function createSharedMusicPresign(
  adminId: string,
  meta: SharedMusicPresignMeta
) {
  requireText(adminId, 'ADMIN_ID_REQUIRED');
  const category = requireCategory(meta.category);
  const contentType = requireAudioType(meta.contentType);
  requireFileSize(meta.fileSize);
  const objectKey = buildSharedAssetKey({
    kind: 'music',
    concept: mapMusicCategoryToConcept(category),
    fileKey: crypto.randomUUID(),
    contentType,
    filename: meta.filename,
  });
  const presigned = await createPresignedUploadUrl({ objectKey, contentType });
  return {
    uploadUrl: presigned.uploadUrl,
    objectKey,
    publicUrl: getInvitationAssetPublicUrl(objectKey),
    headers: { 'Content-Type': contentType },
    expiresIn: presigned.expiresIn,
  };
}

function validateActivation(
  isActive: boolean | undefined,
  commercialUseConfirmed: boolean | undefined
): void {
  if (isActive === true && commercialUseConfirmed !== true) {
    throw new InvitationMusicLibraryError('COMMERCIAL_USE_CONFIRMATION_REQUIRED', 400);
  }
}

function buildTrackCreateData(
  params: ValidatedTrackCreateParams
): Prisma.InvitationMusicTrackUncheckedCreateInput {
  const { adminId, input, category, mimeType, fileSize, objectKey, isActive } = params;
  return {
    title: requireText(input.title, 'TITLE_REQUIRED'),
    artistName: nullableText(input.artistName),
    description: nullableText(input.description),
    category,
    originalFilename: requireText(input.originalFilename, 'ORIGINAL_FILENAME_REQUIRED'),
    objectKey,
    publicUrl: getInvitationAssetPublicUrl(objectKey),
    mimeType,
    fileSize,
    durationSeconds:
      input.durationSeconds == null
        ? null
        : requireInteger(input.durationSeconds, 'INVALID_DURATION_SECONDS'),
    sortOrder: requireInteger(input.sortOrder ?? 0, 'INVALID_SORT_ORDER'),
    isActive,
    licenseType: nullableText(input.licenseType),
    licenseSource: nullableText(input.licenseSource),
    licenseSourceUrl: nullableText(input.licenseSourceUrl),
    attributionText: nullableText(input.attributionText),
    attributionRequired: input.attributionRequired === true,
    commercialUseConfirmed: input.commercialUseConfirmed === true,
    uploadedByAdminId: requireText(adminId, 'ADMIN_ID_REQUIRED'),
  };
}

async function verifyUploadedObject(objectKey: string, fileSize: number, mimeType: string) {
  const objectState = await headObject(objectKey);
  if (!objectState.exists) {
    throw new InvitationMusicLibraryError('MUSIC_OBJECT_NOT_FOUND', 400);
  }
  if (objectState.contentLength != null && objectState.contentLength !== fileSize) {
    throw new InvitationMusicLibraryError('MUSIC_OBJECT_SIZE_MISMATCH', 400);
  }
  if (objectState.contentLength != null && objectState.contentLength < MIN_PLAYABLE_AUDIO_BYTES) {
    throw new InvitationMusicLibraryError('AUDIO_FILE_TOO_SMALL', 400);
  }
  const remoteType = (objectState.contentType || '').toLowerCase().split(';')[0].trim();
  // R2 may omit Content-Type or return octet-stream depending on client PUT headers.
  if (
    remoteType &&
    remoteType !== 'application/octet-stream' &&
    remoteType !== mimeType.toLowerCase()
  ) {
    throw new InvitationMusicLibraryError('MUSIC_OBJECT_TYPE_MISMATCH', 400);
  }
}

async function probeUploadedAudio(objectKey: string, mimeType: string) {
  let buffer: Buffer;
  try {
    buffer = await getObjectBuffer(objectKey);
  } catch {
    throw new InvitationMusicLibraryError('MUSIC_OBJECT_NOT_FOUND', 400);
  }
  try {
    return await probePlayableAudio(buffer, mimeType);
  } catch (error) {
    if (error instanceof PlayableAudioProbeError) {
      throw new InvitationMusicLibraryError(error.code, 400);
    }
    throw new InvitationMusicLibraryError('INVALID_AUDIO_FILE', 400);
  }
}

export async function confirmSharedMusic(adminId: string, input: ConfirmSharedMusicInput) {
  const category = requireCategory(input.category);
  const mimeType = requireAudioType(input.mimeType);
  const fileSize = requireFileSize(input.fileSize);
  const objectKey = assertSharedMusicObjectKey(input.objectKey, category, mimeType);
  const isActive = input.isActive === true;
  validateActivation(isActive, input.commercialUseConfirmed);
  await verifyUploadedObject(objectKey, fileSize, mimeType);
  const probe = await probeUploadedAudio(objectKey, mimeType);
  const data = buildTrackCreateData({
    adminId,
    input: {
      ...input,
      // Server probe is SSOT — never trust client-reported duration alone.
      durationSeconds: probe.durationSeconds,
    },
    category,
    mimeType,
    fileSize,
    objectKey,
    isActive,
  });
  return prisma.invitationMusicTrack.create({ data });
}

function buildSearchFilter(search?: string): Prisma.InvitationMusicTrackWhereInput | undefined {
  const normalized = normalizeText(search);
  if (!normalized) return undefined;
  return {
    OR: [
      { title: { contains: normalized, mode: 'insensitive' } },
      { artistName: { contains: normalized, mode: 'insensitive' } },
      { description: { contains: normalized, mode: 'insensitive' } },
    ],
  };
}

export async function listAdminTracks(filters: AdminTrackFilters = {}) {
  return prisma.invitationMusicTrack.findMany({
    where: {
      ...(filters.category ? { category: requireCategory(filters.category) } : {}),
      ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
      ...(filters.isArchived === undefined ? {} : { isArchived: filters.isArchived }),
      ...buildSearchFilter(filters.search),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function listPublicTracks(
  concept?: Exclude<InvitationMusicCategory, 'COMMON'>,
  search?: string
) {
  const categories = buildPublicCategoryFilter(concept);
  return prisma.invitationMusicTrack.findMany({
    where: {
      isActive: true,
      isArchived: false,
      // Exclude placeholders / unprobed stubs from Editor & Public selection.
      fileSize: { gte: MIN_PLAYABLE_AUDIO_BYTES },
      durationSeconds: { gt: 0 },
      publicUrl: { not: '' },
      ...(categories ? { category: { in: categories } } : {}),
      ...buildSearchFilter(search),
    },
    select: PUBLIC_TRACK_SELECT,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

/** Development QA cleanup helper — archive known unplayable shared tracks. */
export async function archiveUnplayableTrackByObjectKey(objectKey: string) {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const existing = await prisma.invitationMusicTrack.findFirst({
    where: { objectKey: normalized },
  });
  if (!existing) {
    throw new InvitationMusicLibraryError('MUSIC_TRACK_NOT_FOUND', 404);
  }
  if (existing.isArchived) {
    return existing;
  }
  return archiveTrack(existing.id);
}

export async function updateTrack(id: string, input: UpdateTrackInput) {
  const existing = await prisma.invitationMusicTrack.findUnique({ where: { id } });
  if (!existing) throw new InvitationMusicLibraryError('MUSIC_TRACK_NOT_FOUND', 404);
  const commercialUseConfirmed =
    input.commercialUseConfirmed ?? existing.commercialUseConfirmed;
  const isActive = input.isActive ?? existing.isActive;
  validateActivation(isActive, commercialUseConfirmed);

  return prisma.invitationMusicTrack.update({
    where: { id },
    data: {
      title: input.title === undefined ? undefined : requireText(input.title, 'TITLE_REQUIRED'),
      artistName: nullableText(input.artistName),
      description: nullableText(input.description),
      category: input.category === undefined ? undefined : requireCategory(input.category),
      durationSeconds:
        input.durationSeconds === undefined
          ? undefined
          : input.durationSeconds === null
            ? null
            : requireInteger(input.durationSeconds, 'INVALID_DURATION_SECONDS'),
      sortOrder:
        input.sortOrder === undefined
          ? undefined
          : requireInteger(input.sortOrder, 'INVALID_SORT_ORDER'),
      isActive: input.isActive,
      licenseType: nullableText(input.licenseType),
      licenseSource: nullableText(input.licenseSource),
      licenseSourceUrl: nullableText(input.licenseSourceUrl),
      attributionText: nullableText(input.attributionText),
      attributionRequired: input.attributionRequired,
      commercialUseConfirmed: input.commercialUseConfirmed,
    },
  });
}

export async function archiveTrack(id: string) {
  const existing = await prisma.invitationMusicTrack.findUnique({ where: { id } });
  if (!existing) throw new InvitationMusicLibraryError('MUSIC_TRACK_NOT_FOUND', 404);
  return prisma.invitationMusicTrack.update({
    where: { id },
    data: { isActive: false, isArchived: true, archivedAt: new Date() },
  });
}

type UsageRow = { id: string; total_count: number };

export async function countTrackUsage(trackId: string) {
  const rows = await prisma.$queryRaw<UsageRow[]>(Prisma.sql`
    SELECT "id", COUNT(*) OVER()::integer AS "total_count"
    FROM "invitations"
    WHERE "is_deleted" = false
      AND (
        "data_json" #>> '{music,trackId}' = ${trackId}
        OR "data_json" #>> '{music,musicKey}' = ${trackId}
      )
    ORDER BY "created_at" DESC
    LIMIT 20
  `);
  return {
    count: rows[0]?.total_count ?? 0,
    invitationIds: rows.map((row) => row.id),
  };
}

export function ensureTrackCanBeDeleted(usageCount: number): void {
  if (usageCount > 0) {
    throw new InvitationMusicLibraryError('USAGE_BLOCKED', 409);
  }
}

export async function deleteTrack(id: string) {
  const existing = await prisma.invitationMusicTrack.findUnique({ where: { id } });
  if (!existing) throw new InvitationMusicLibraryError('MUSIC_TRACK_NOT_FOUND', 404);
  const usage = await countTrackUsage(id);
  ensureTrackCanBeDeleted(usage.count);
  const archived = await archiveTrack(id);
  await deleteObject(existing.objectKey).catch((error) => {
    console.warn('Failed to delete shared music object:', { id, objectKey: existing.objectKey, error });
  });
  return archived;
}

export async function getDashboardMusicSummary() {
  const [total, active, inactive, archived, recent, bytes] = await prisma.$transaction([
    prisma.invitationMusicTrack.count(),
    prisma.invitationMusicTrack.count({ where: { isActive: true, isArchived: false } }),
    prisma.invitationMusicTrack.count({ where: { isActive: false, isArchived: false } }),
    prisma.invitationMusicTrack.count({ where: { isArchived: true } }),
    prisma.invitationMusicTrack.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.invitationMusicTrack.aggregate({ _sum: { fileSize: true } }),
  ]);
  return { total, active, inactive, archived, recent, totalBytes: bytes._sum.fileSize ?? 0 };
}

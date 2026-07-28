/**
 * Global Invitation R2 object key SSOT.
 * Bucket: platform-assets (via R2_BUCKET_NAME).
 *
 * Canonical user asset:
 *   invitation/{environment}/users/{userId}/invitations/{invitationId}/{scope}/{fileId}.{ext}
 * Shared (no environment):
 *   invitation/shared/{images|music}/{concept}/{fileKey}.{ext}
 * Temp:
 *   invitation/{environment}/temp/{userId}/{uploadId}/{fileId}.{ext}
 *
 * Do NOT use R2_KEY_PREFIX here — that value is for other services / legacy template keys.
 * Do not concatenate keys in routes/components — use these builders only.
 */

import crypto from 'crypto';
import { buildCanonicalPublicUrl } from './mediaKeyBuilder';

export type InvitationAssetType =
  | 'hero'
  | 'groom-profile'
  | 'bride-profile'
  | 'gallery'
  | 'location'
  | 'user-music'
  | 'shared-image'
  | 'shared-music';

export type InvitationSharedConcept = 'wedding' | 'funeral' | 'general' | 'common';

export type InvitationAssetEnvironment = 'development' | 'production';

const USER_UPLOAD_TYPES = new Set<InvitationAssetType>([
  'hero',
  'groom-profile',
  'bride-profile',
  'gallery',
  'location',
  'user-music',
]);

const INVITATION_ENVIRONMENTS = new Set<string>(['development', 'production']);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/x-m4a': 'm4a',
};

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').trim();
}

function sanitizeExtension(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function normalizeObjectKey(objectKey: string): string {
  return objectKey.trim().replace(/^\/+/, '');
}

function joinR2Key(...parts: Array<string | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join('/')
    .replace(/\/{2,}/g, '/');
}

export function getInvitationRootPrefix(): string {
  const raw = (process.env.INVITATION_R2_ROOT_PREFIX || 'invitation').trim().replace(/^\/+|\/+$/g, '');
  return sanitizeSegment(raw) || 'invitation';
}

/**
 * Server-side only. Never trust client body / hostname for environment.
 * Priority: INVITATION_ASSET_ENVIRONMENT → RAILWAY_ENVIRONMENT_NAME → NODE_ENV fallback.
 */
export function getInvitationAssetEnvironment(): InvitationAssetEnvironment {
  const explicit = (process.env.INVITATION_ASSET_ENVIRONMENT || '').trim().toLowerCase();
  if (explicit === 'production' || explicit === 'development') {
    return explicit;
  }

  const railwayEnvironment = (process.env.RAILWAY_ENVIRONMENT_NAME || '').trim().toLowerCase();
  if (railwayEnvironment === 'production') {
    return 'production';
  }
  if (railwayEnvironment === 'development') {
    return 'development';
  }

  if ((process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
    return 'production';
  }
  return 'development';
}

export function isInvitationAssetEnvironment(value: string | undefined): value is InvitationAssetEnvironment {
  return Boolean(value && INVITATION_ENVIRONMENTS.has(value));
}

/**
 * Legacy wrong-order keys: `{environment}/invitation/...` → `invitation/...`
 * Does not strip environment from canonical `invitation/{environment}/...`.
 */
export function peelLegacyEnvironmentPrefix(objectKey: string): string {
  const normalized = normalizeObjectKey(objectKey);
  const segments = normalized.split('/').filter(Boolean);
  const root = getInvitationRootPrefix();
  if (
    segments.length >= 2 &&
    isInvitationAssetEnvironment(segments[0]) &&
    segments[1] === root
  ) {
    return segments.slice(1).join('/');
  }
  return normalized;
}

export function isUserUploadAssetType(assetType: InvitationAssetType): boolean {
  return USER_UPLOAD_TYPES.has(assetType);
}

export function resolveInvitationAssetExtension(contentType: string, filename?: string): string {
  const fromMime = MIME_EXTENSION_MAP[contentType] || '';
  if (fromMime) return fromMime;
  const ext = filename?.split('.').pop() || '';
  return sanitizeExtension(ext) || 'bin';
}

function newFileId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function assetFolder(assetType: InvitationAssetType): string {
  switch (assetType) {
    case 'hero':
      return 'hero';
    case 'groom-profile':
      return 'couple/groom';
    case 'bride-profile':
      return 'couple/bride';
    case 'gallery':
      return 'gallery';
    case 'location':
      return 'location';
    case 'user-music':
      return 'music';
    default:
      throw new Error('INVALID_INVITATION_ASSET_TYPE');
  }
}

function resolveAssetScopeSegments(assetType: InvitationAssetType): string[] {
  return assetFolder(assetType).split('/').filter(Boolean);
}

/**
 * User invitation asset (canonical):
 * invitation/{environment}/users/{userId}/invitations/{invitationId}/{folder}/{fileId}.{ext}
 */
export function buildInvitationAssetKey(params: {
  userId: string;
  invitationId: string;
  assetType: InvitationAssetType;
  contentType: string;
  filename?: string;
  fileId?: string;
}): string {
  if (!isUserUploadAssetType(params.assetType)) {
    throw new Error('SHARED_ASSET_UPLOAD_DENIED');
  }
  const userId = sanitizeSegment(params.userId);
  const invitationId = sanitizeSegment(params.invitationId);
  if (!userId || !invitationId) {
    throw new Error('INVALID_MEDIA_OWNER');
  }
  const ext = resolveInvitationAssetExtension(params.contentType, params.filename);
  const fileId = sanitizeSegment(params.fileId || newFileId()) || newFileId();
  return joinR2Key(
    getInvitationRootPrefix(),
    getInvitationAssetEnvironment(),
    'users',
    userId,
    'invitations',
    invitationId,
    ...resolveAssetScopeSegments(params.assetType),
    `${fileId}.${ext}`
  );
}

/**
 * Shared catalog asset (admin/deploy only) — no environment segment:
 * invitation/shared/{images|music}/{concept}/{fileKey}.{ext}
 */
export function buildSharedAssetKey(params: {
  kind: 'images' | 'music';
  concept: InvitationSharedConcept;
  fileKey: string;
  contentType: string;
  filename?: string;
}): string {
  const concept = sanitizeSegment(params.concept);
  const fileKey = sanitizeSegment(params.fileKey);
  if (!concept || !fileKey) {
    throw new Error('INVALID_SHARED_ASSET_KEY');
  }
  const ext = resolveInvitationAssetExtension(params.contentType, params.filename);
  return joinR2Key(
    getInvitationRootPrefix(),
    'shared',
    params.kind,
    concept,
    `${fileKey}.${ext}`
  );
}

/**
 * Staging upload:
 * invitation/{environment}/temp/{userId}/{uploadId}/{fileId}.{ext}
 */
export function buildInvitationTempKey(params: {
  userId: string;
  uploadId?: string;
  contentType: string;
  filename?: string;
}): string {
  const userId = sanitizeSegment(params.userId);
  if (!userId) throw new Error('INVALID_TEMP_SESSION');
  const uploadId = sanitizeSegment(params.uploadId || newFileId()) || newFileId();
  const fileId = newFileId();
  const ext = resolveInvitationAssetExtension(params.contentType, params.filename);
  return joinR2Key(
    getInvitationRootPrefix(),
    getInvitationAssetEnvironment(),
    'temp',
    userId,
    uploadId,
    `${fileId}.${ext}`
  );
}

export function getInvitationAssetPublicUrl(objectKey: string): string {
  return buildCanonicalPublicUrl(objectKey);
}

export function assertCanonicalInvitationUserAssetKey(objectKey: string): void {
  const root = getInvitationRootPrefix();
  const env = getInvitationAssetEnvironment();
  const prefix = `${root}/${env}/users/`;
  if (!normalizeObjectKey(objectKey).startsWith(prefix)) {
    throw new Error('INVALID_MEDIA_OBJECT_KEY');
  }
}

/**
 * Parse canonical + legacy user asset keys.
 * Canonical: invitation/{env}/users/{userId}/invitations/{invitationId}/...
 * Legacy A:  invitation/users/{userId}/invitations/{invitationId}/...
 * Legacy B:  {env}/invitation/users/{userId}/invitations/{invitationId}/...
 */
export function parseInvitationUserAssetKey(objectKey: string): {
  userId: string;
  invitationId: string;
  folder: string;
  environment?: InvitationAssetEnvironment;
  variant: 'canonical' | 'legacy';
} | null {
  const relative = peelLegacyEnvironmentPrefix(objectKey);
  const segments = relative.split('/').filter(Boolean);
  const root = getInvitationRootPrefix();
  if (segments[0] !== root) return null;

  // invitation/{env}/users/{userId}/invitations/{invitationId}/...
  if (
    isInvitationAssetEnvironment(segments[1]) &&
    segments[2] === 'users' &&
    segments[4] === 'invitations' &&
    segments[3] &&
    segments[5]
  ) {
    return {
      userId: segments[3],
      invitationId: segments[5],
      folder: segments.slice(6, -1).join('/') || segments[6] || '',
      environment: segments[1],
      variant: 'canonical',
    };
  }

  // invitation/users/{userId}/invitations/{invitationId}/... (legacy without env under root)
  if (segments[1] === 'users' && segments[3] === 'invitations' && segments[2] && segments[4]) {
    return {
      userId: segments[2],
      invitationId: segments[4],
      folder: segments.slice(5, -1).join('/') || segments[5] || '',
      variant: 'legacy',
    };
  }

  return null;
}

export function isSharedInvitationAssetKey(objectKey: string): boolean {
  const segments = peelLegacyEnvironmentPrefix(objectKey).split('/').filter(Boolean);
  const root = getInvitationRootPrefix();
  if (segments[0] !== root) return false;
  if (segments[1] === 'shared') return true;
  // Forbidden shape invitation/{env}/shared — still treat as shared to deny user ops
  if (isInvitationAssetEnvironment(segments[1]) && segments[2] === 'shared') return true;
  return false;
}

export function assertNotPathTraversal(objectKey: string): void {
  if (!objectKey || objectKey.includes('..') || objectKey.includes('\\') || objectKey.includes('%')) {
    throw new Error('INVALID_MEDIA_OBJECT_KEY');
  }
}

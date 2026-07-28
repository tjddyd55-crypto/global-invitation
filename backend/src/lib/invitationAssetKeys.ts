/**
 * Global Invitation R2 object key SSOT.
 * Bucket: platform-assets (via R2_BUCKET_NAME).
 * Root: invitation/ (+ optional R2_KEY_PREFIX e.g. development/)
 *
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

const USER_UPLOAD_TYPES = new Set<InvitationAssetType>([
  'hero',
  'groom-profile',
  'bride-profile',
  'gallery',
  'location',
  'user-music',
]);

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

function getStorageKeyPrefix(): string {
  const raw = (process.env.R2_KEY_PREFIX || '').trim().replace(/^\/+|\/+$/g, '');
  if (!raw) return '';
  const safe = sanitizeSegment(raw);
  return safe ? `${safe}/` : '';
}

function applyStorageKeyPrefix(objectKey: string): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const prefix = getStorageKeyPrefix();
  if (!prefix || !normalized || normalized.startsWith(prefix)) {
    return normalized;
  }
  return `${prefix}${normalized}`;
}

function stripStorageKeyPrefixLocal(objectKey: string): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const prefix = getStorageKeyPrefix();
  if (prefix && normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
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

/**
 * User invitation asset:
 * invitation/users/{userId}/invitations/{invitationId}/{folder}/{fileId}.{ext}
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
  const folder = assetFolder(params.assetType);
  const ext = resolveInvitationAssetExtension(params.contentType, params.filename);
  const fileId = sanitizeSegment(params.fileId || newFileId()) || newFileId();
  const key = `invitation/users/${userId}/invitations/${invitationId}/${folder}/${fileId}.${ext}`;
  return applyStorageKeyPrefix(key);
}

/**
 * Shared catalog asset (admin/deploy only):
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
  const key = `invitation/shared/${params.kind}/${concept}/${fileKey}.${ext}`;
  return applyStorageKeyPrefix(key);
}

/**
 * Staging upload:
 * invitation/temp/{userId}/{uploadId}/{fileId}.{ext}
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
  const key = `invitation/temp/${userId}/${uploadId}/${fileId}.${ext}`;
  return applyStorageKeyPrefix(key);
}

export function getInvitationAssetPublicUrl(objectKey: string): string {
  return buildCanonicalPublicUrl(objectKey);
}

export function parseInvitationUserAssetKey(objectKey: string): {
  userId: string;
  invitationId: string;
  folder: string;
} | null {
  const normalized = stripStorageKeyPrefixLocal(objectKey);
  const segments = normalized.split('/').filter(Boolean);
  if (
    segments[0] !== 'invitation' ||
    segments[1] !== 'users' ||
    segments[3] !== 'invitations' ||
    !segments[2] ||
    !segments[4]
  ) {
    return null;
  }
  return {
    userId: segments[2],
    invitationId: segments[4],
    folder: segments.slice(5, -1).join('/') || segments[5] || '',
  };
}

export function isSharedInvitationAssetKey(objectKey: string): boolean {
  const normalized = stripStorageKeyPrefixLocal(objectKey);
  return normalized.startsWith('invitation/shared/');
}

export function assertNotPathTraversal(objectKey: string): void {
  if (!objectKey || objectKey.includes('..') || objectKey.includes('\\') || objectKey.includes('%')) {
    throw new Error('INVALID_MEDIA_OBJECT_KEY');
  }
}

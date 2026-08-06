/**
 * Protection + eligibility for temporary invitation media cleanup.
 * Exact-key only. Never delete shared / foreign prefixes.
 */

import {
  getInvitationRootPrefix,
  isSharedInvitationAssetKey,
  normalizeCanonicalInvitationObjectKey,
  parseInvitationUserAssetKey,
} from '../invitationAssetKeys';

export function isProtectedInvitationSharedAsset(objectKey: string): boolean {
  const key = normalizeCanonicalInvitationObjectKey(objectKey || '');
  if (!key) return true;
  if (isSharedInvitationAssetKey(key)) return true;
  if (key.includes('/shared/')) return true;
  return false;
}

/**
 * Eligible for unreferenced-temp cleanup:
 * canonical invitation/{env}/users/{userId}/invitations/{invitationId}/...
 */
export function isEligibleTempInvitationUserAssetKey(objectKey: string): boolean {
  const key = normalizeCanonicalInvitationObjectKey(objectKey || '');
  if (!key || key.includes('..') || key.includes('\\')) return false;
  if (isProtectedInvitationSharedAsset(key)) return false;
  const parsed = parseInvitationUserAssetKey(key);
  return parsed?.variant === 'canonical';
}

/** Staging temp under invitation/{env}/temp/... */
export function isInvitationEnvTempStagingKey(objectKey: string): boolean {
  const key = normalizeCanonicalInvitationObjectKey(objectKey || '');
  const root = getInvitationRootPrefix();
  const parts = key.split('/').filter(Boolean);
  return parts[0] === root && (parts[1] === 'development' || parts[1] === 'production') && parts[2] === 'temp';
}

export function normalizeMediaReferenceToken(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const path = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
      return path || null;
    } catch {
      return null;
    }
  }

  return normalizeCanonicalInvitationObjectKey(trimmed) || null;
}

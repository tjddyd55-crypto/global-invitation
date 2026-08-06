/**
 * Guard user media DELETE against active Invitation dataJson references.
 */
import {
  isActivelyReferenced,
  scanInvitationMediaReferences,
} from './scanInvitationReferences';
import { isProtectedInvitationSharedAsset, isEligibleTempInvitationUserAssetKey } from './protection';
import { normalizeCanonicalInvitationObjectKey } from '../invitationAssetKeys';

export async function assertInvitationUserMediaSafeToDelete(objectKey: string): Promise<void> {
  const key = normalizeCanonicalInvitationObjectKey(objectKey || '');
  if (!key) {
    throw new Error('MEDIA_TARGET_REQUIRED');
  }
  if (isProtectedInvitationSharedAsset(key)) {
    throw new Error('PROTECTED_SHARED_MEDIA');
  }

  // Only enforce active-ref guard for canonical invitation user assets.
  if (!isEligibleTempInvitationUserAssetKey(key)) {
    return;
  }

  const index = await scanInvitationMediaReferences();
  if (index.status === 'failed') {
    throw new Error('MEDIA_REFERENCE_SCAN_FAILED');
  }
  if (isActivelyReferenced(key, index)) {
    console.warn('[media-delete] blocked active reference', { objectKey: key });
    throw new Error('MEDIA_STILL_REFERENCED');
  }
}
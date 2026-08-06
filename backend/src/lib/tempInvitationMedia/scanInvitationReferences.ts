/**
 * Invitation-only media reference scan (excludes MediaFile self-hits).
 * Used to decide ATTACHED vs unreferenced TEMP candidates.
 */

import prisma from '../prisma';
import { normalizeCanonicalInvitationObjectKey } from '../invitationAssetKeys';
import { normalizeMediaReferenceToken } from './protection';

export type InvitationReferenceIndex = {
  status: 'ok' | 'failed';
  errorMessage?: string;
  /** objectKey → invitation ids that reference it (active = not soft-deleted) */
  activeKeys: Set<string>;
  deletedKeys: Set<string>;
  invitationCount: number;
};

function collectKeysFromValue(value: unknown, into: Set<string>, depth = 0): void {
  if (depth > 14 || value == null) return;
  if (typeof value === 'string') {
    const key = normalizeMediaReferenceToken(value);
    if (key) into.add(normalizeCanonicalInvitationObjectKey(key));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectKeysFromValue(item, into, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectKeysFromValue(nested, into, depth + 1);
    }
  }
}

/**
 * Scan Invitation.data / dataJson / musicKey only.
 * Soft-deleted invitations contribute to deletedKeys (do not protect forever).
 */
export async function scanInvitationMediaReferences(): Promise<InvitationReferenceIndex> {
  const activeKeys = new Set<string>();
  const deletedKeys = new Set<string>();

  try {
    const invitations = await prisma.invitation.findMany({
      select: {
        id: true,
        musicKey: true,
        data: true,
        dataJson: true,
        isDeleted: true,
      },
    });

    for (const invitation of invitations) {
      const keys = new Set<string>();
      if (invitation.musicKey) {
        collectKeysFromValue(invitation.musicKey, keys);
      }
      collectKeysFromValue(invitation.data, keys);
      collectKeysFromValue(invitation.dataJson, keys);
      const target = invitation.isDeleted ? deletedKeys : activeKeys;
      for (const key of keys) target.add(key);
    }

    return {
      status: 'ok',
      activeKeys,
      deletedKeys,
      invitationCount: invitations.length,
    };
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'INVITATION_REFERENCE_SCAN_FAILED',
      activeKeys,
      deletedKeys,
      invitationCount: 0,
    };
  }
}

export function isActivelyReferenced(
  objectKey: string,
  index: InvitationReferenceIndex
): boolean {
  if (index.status === 'failed') {
    // Fail closed — never delete when reference scan failed
    return true;
  }
  const key = normalizeCanonicalInvitationObjectKey(objectKey);
  if (index.activeKeys.has(key)) return true;
  // Suffix / URL-path soft match for encoding variants
  for (const active of index.activeKeys) {
    if (active === key || active.endsWith(`/${key}`) || key.endsWith(`/${active}`)) {
      return true;
    }
  }
  return false;
}

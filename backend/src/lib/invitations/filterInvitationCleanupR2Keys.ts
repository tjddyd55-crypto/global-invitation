import { isProtectedInvitationSharedAsset } from '../tempInvitationMedia/protection';

/** Invitation delete cleanup must never enqueue shared template/JCI assets. */
export function filterInvitationCleanupR2Keys(keys: string[]): string[] {
  return keys.filter((key) => {
    const trimmed = key.trim();
    if (!trimmed) return false;
    return !isProtectedInvitationSharedAsset(trimmed);
  });
}

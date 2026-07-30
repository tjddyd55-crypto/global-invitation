/**
 * Static catalog of R2 prefixes known from code review (not a live ripgrep).
 * Used to mark PROTECTED_CODE_REFERENCE vs unused discovery.
 */

export type CodePathReference = {
  prefix: string;
  kind: 'runtime_write' | 'runtime_read_compat' | 'gradual_purge_only' | 'test_only' | 'docs_only';
  source: string;
};

export const CODE_PATH_REFERENCE_CATALOG: CodePathReference[] = [
  {
    prefix: 'invitation/',
    kind: 'runtime_write',
    source: 'invitationAssetKeys.buildInvitationAssetKey / buildSharedAssetKey',
  },
  {
    prefix: 'invitation/shared/music/',
    kind: 'runtime_write',
    source: 'invitationMusicLibraryService',
  },
  {
    prefix: 'invitation/shared/images/',
    kind: 'runtime_write',
    source: 'buildSharedAssetKey kind=images',
  },
  {
    prefix: 'development/invitation/',
    kind: 'runtime_read_compat',
    source: 'peelLegacyEnvironmentPrefix',
  },
  {
    prefix: 'production/invitation/',
    kind: 'runtime_read_compat',
    source: 'peelLegacyEnvironmentPrefix',
  },
  {
    prefix: 'invitations/',
    kind: 'gradual_purge_only',
    source: 'LEGACY_MEDIA_STORAGE_PREFIXES',
  },
  {
    prefix: 'templates/thumbnails/',
    kind: 'gradual_purge_only',
    source: 'LEGACY_MEDIA_STORAGE_PREFIXES',
  },
  {
    prefix: 'creator/',
    kind: 'gradual_purge_only',
    source: 'LEGACY_MEDIA_STORAGE_PREFIXES',
  },
  {
    prefix: 'users/',
    kind: 'gradual_purge_only',
    source: 'LEGACY_MEDIA_STORAGE_PREFIXES (ambiguous — needs invitation signal)',
  },
  {
    prefix: 'temp/',
    kind: 'runtime_write',
    source: 'buildR2Key / buildTempObjectKey staging',
  },
  {
    prefix: 'template/',
    kind: 'runtime_write',
    source: 'media/keys templateEntityPrefix',
  },
];

export function countCodeReferencesForKey(key: string): {
  count: number;
  kinds: string[];
} {
  const normalized = key.replace(/^\/+/, '');
  const kinds: string[] = [];
  for (const entry of CODE_PATH_REFERENCE_CATALOG) {
    if (normalized.startsWith(entry.prefix)) {
      kinds.push(`${entry.kind}:${entry.prefix}`);
    }
  }
  return { count: kinds.length, kinds };
}

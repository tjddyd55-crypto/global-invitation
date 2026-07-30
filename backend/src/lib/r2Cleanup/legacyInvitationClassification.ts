/**
 * Phase-1/2 R2 cleanup classification — pure rules, no network I/O.
 * invitation/ is hard-protected SSOT. SAFE_TO_DELETE requires explicit allowlist match.
 */

export const PROTECTED_SSOT_PREFIXES = ['invitation/'] as const;

export const QUARANTINE_PREFIX = 'cleanup-quarantine/invitation-legacy/';

/** Known non-invitation platform prefixes (extend as inventory reveals more). */
export const OTHER_PROJECT_PREFIXES = [
  'insurance/',
  'government/',
  'liquor/',
  'display/',
  'sggolf/',
  'crm/',
  'customer/',
  'claim/',
  'fax/',
  'profile/',
  'document/',
  // shared/ at bucket root is not invitation/shared/
  'shared/',
] as const;

/**
 * Code still lists / gradually purges these (mediaCleanup).
 * Objects under these prefixes are never auto SAFE_TO_DELETE without allowlist.
 */
export const CODE_LEGACY_STORAGE_PREFIXES = [
  'invitations/',
  'templates/thumbnails/',
  'creator/',
  'users/',
] as const;

/**
 * Strong invitation-legacy path signals outside invitation/.
 * Used for LEGACY_INVITATION_CANDIDATE discovery only — not auto-delete.
 */
export const LEGACY_INVITATION_SEARCH_PREFIXES = [
  'invitations/',
  'invitation-assets/',
  'invitation_asset/',
  'invitation-assets-v1/',
  'invitations-development/',
  'invitations-production/',
  'global-invitation/',
  'global_invitation/',
  'globalInvitation/',
  'wedding-invitation/',
  'wedding-assets/',
  'invite/',
  'invites/',
  'invite-assets/',
  'invitation-temp/',
  'invitation-test/',
  'invitation-dev/',
  'invitation-prod/',
  'temp/invitation/',
  'tmp/invitation/',
  'uploads/invitation/',
  'development/invitation/',
  'production/invitation/',
] as const;

/**
 * Explicit deletion allowlist (prefix startsWith).
 * Empty by default — Phase 1 must not auto-approve deletes.
 * Operators add prefixes only after reviewing DRY_RUN reports.
 */
export const SAFE_DELETE_ALLOWLIST_PREFIXES: readonly string[] = [];

export type ObjectClassification =
  | 'PROTECTED_SSOT'
  | 'PROTECTED_OTHER_PROJECT'
  | 'PROTECTED_DB_REFERENCE'
  | 'PROTECTED_CODE_REFERENCE'
  | 'LEGACY_INVITATION_CANDIDATE'
  | 'SAFE_TO_DELETE'
  | 'UNKNOWN';

export type ClassificationInput = {
  key: string;
  dbReferenceCount?: number;
  dbReferenceStatus?:
    | 'DB_ACTIVE_REFERENCE'
    | 'DB_ARCHIVED_REFERENCE'
    | 'DB_REFERENCE_NOT_FOUND'
    | 'REFERENCE_CHECK_FAILED';
  /** Optional override allowlist for tests */
  safeDeleteAllowlist?: readonly string[];
};

export type ClassificationResult = {
  classification: ObjectClassification;
  reason: string;
  matchedLegacyPrefix: string | null;
  topLevelPrefix: string;
  protected: boolean;
  deleteCandidate: boolean;
};

export function normalizeObjectKey(key: string): string {
  return key.trim().replace(/^\/+/, '');
}

export function topLevelPrefix(key: string): string {
  const normalized = normalizeObjectKey(key);
  const slash = normalized.indexOf('/');
  if (slash <= 0) {
    return normalized ? `${normalized}/` : '';
  }
  return `${normalized.slice(0, slash)}/`;
}

export function isProtectedSsotKey(key: string): boolean {
  const normalized = normalizeObjectKey(key);
  return PROTECTED_SSOT_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isQuarantineKey(key: string): boolean {
  return normalizeObjectKey(key).startsWith(QUARANTINE_PREFIX);
}

function matchPrefix(key: string, prefixes: readonly string[]): string | null {
  const normalized = normalizeObjectKey(key);
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

function hasStrongInvitationSignal(key: string): boolean {
  const normalized = normalizeObjectKey(key).toLowerCase();
  if (matchPrefix(normalized, LEGACY_INVITATION_SEARCH_PREFIXES)) {
    return true;
  }
  // users/{id}/invitations/... legacy shape
  if (/^users\/[^/]+\/invitations\//.test(normalized)) {
    return true;
  }
  // env-prefixed peeled legacy: development/invitation/...
  if (/^(development|production|staging|preview)\/invitation\//.test(normalized)) {
    return true;
  }
  // Require invitation/invite token plus a media role token (avoid bare "gallery"/"music").
  const hasProjectToken =
    normalized.includes('invitation') ||
    normalized.includes('/invite/') ||
    normalized.startsWith('invite/') ||
    normalized.includes('global-invitation') ||
    normalized.includes('global_invitation');
  if (!hasProjectToken) {
    return false;
  }
  return (
    normalized.includes('/gallery/') ||
    normalized.includes('/hero/') ||
    normalized.includes('/groom/') ||
    normalized.includes('/bride/') ||
    normalized.includes('/music/') ||
    normalized.includes('/og/') ||
    normalized.includes('wedding') ||
    normalized.includes('funeral')
  );
}

function isOtherProjectKey(key: string): boolean {
  const top = topLevelPrefix(key);
  return OTHER_PROJECT_PREFIXES.some((prefix) => top === prefix || key.startsWith(prefix));
}

/**
 * Classify a single object key. Never returns SAFE_TO_DELETE for invitation/ keys.
 */
export function classifyLegacyInvitationObject(input: ClassificationInput): ClassificationResult {
  const key = normalizeObjectKey(input.key);
  const top = topLevelPrefix(key);
  const allowlist = input.safeDeleteAllowlist ?? SAFE_DELETE_ALLOWLIST_PREFIXES;

  if (!key) {
    return {
      classification: 'UNKNOWN',
      reason: 'empty_key',
      matchedLegacyPrefix: null,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  if (isProtectedSsotKey(key)) {
    return {
      classification: 'PROTECTED_SSOT',
      reason: 'starts_with_invitation/',
      matchedLegacyPrefix: 'invitation/',
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  if (isQuarantineKey(key)) {
    return {
      classification: 'PROTECTED_SSOT',
      reason: 'cleanup_quarantine_prefix',
      matchedLegacyPrefix: QUARANTINE_PREFIX,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  const dbStatus = input.dbReferenceStatus;
  const dbCount = input.dbReferenceCount ?? 0;
  if (
    dbStatus === 'DB_ACTIVE_REFERENCE' ||
    dbStatus === 'DB_ARCHIVED_REFERENCE' ||
    dbStatus === 'REFERENCE_CHECK_FAILED' ||
    dbCount > 0
  ) {
    return {
      classification: 'PROTECTED_DB_REFERENCE',
      reason: dbStatus || 'db_reference_count_gt_0',
      matchedLegacyPrefix: matchPrefix(key, LEGACY_INVITATION_SEARCH_PREFIXES),
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  if (isOtherProjectKey(key)) {
    return {
      classification: 'PROTECTED_OTHER_PROJECT',
      reason: `other_project_prefix:${top}`,
      matchedLegacyPrefix: null,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  const codeLegacy = matchPrefix(key, CODE_LEGACY_STORAGE_PREFIXES);
  // users/ alone is ambiguous — only treat as code-legacy when invitation-shaped.
  if (codeLegacy === 'users/' && !hasStrongInvitationSignal(key)) {
    return {
      classification: 'UNKNOWN',
      reason: 'users_prefix_without_invitation_signal',
      matchedLegacyPrefix: null,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }
  if (codeLegacy) {
    // Still referenced by gradual-purge / parsers — protect unless allowlisted later.
    const allow = matchPrefix(key, allowlist);
    if (allow && hasStrongInvitationSignal(key) && dbStatus === 'DB_REFERENCE_NOT_FOUND') {
      return {
        classification: 'SAFE_TO_DELETE',
        reason: `allowlist:${allow}`,
        matchedLegacyPrefix: codeLegacy,
        topLevelPrefix: top,
        protected: false,
        deleteCandidate: true,
      };
    }
    return {
      classification: 'PROTECTED_CODE_REFERENCE',
      reason: `code_legacy_prefix:${codeLegacy}`,
      matchedLegacyPrefix: codeLegacy,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  const legacyMatch =
    matchPrefix(key, LEGACY_INVITATION_SEARCH_PREFIXES) ||
    (hasStrongInvitationSignal(key) ? 'signal:invitation' : null);

  if (legacyMatch) {
    const allow = matchPrefix(key, allowlist);
    if (allow && dbStatus === 'DB_REFERENCE_NOT_FOUND') {
      return {
        classification: 'SAFE_TO_DELETE',
        reason: `allowlist:${allow}`,
        matchedLegacyPrefix: legacyMatch,
        topLevelPrefix: top,
        protected: false,
        deleteCandidate: true,
      };
    }
    return {
      classification: 'LEGACY_INVITATION_CANDIDATE',
      reason: `legacy_signal:${legacyMatch}`,
      matchedLegacyPrefix: legacyMatch,
      topLevelPrefix: top,
      protected: true,
      deleteCandidate: false,
    };
  }

  return {
    classification: 'UNKNOWN',
    reason: 'no_invitation_evidence',
    matchedLegacyPrefix: null,
    topLevelPrefix: top,
    protected: true,
    deleteCandidate: false,
  };
}

export function assertKeyNotProtectedSsot(key: string): void {
  if (isProtectedSsotKey(key) || isQuarantineKey(key)) {
    throw new Error('Protected invitation SSOT key');
  }
}

export function canDeleteFromManifestItem(item: {
  key: string;
  classification: ObjectClassification;
  approved: boolean;
  reviewed: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (!item.approved || !item.reviewed) {
    return { ok: false, reason: 'not_approved' };
  }
  if (item.classification !== 'SAFE_TO_DELETE') {
    return { ok: false, reason: 'classification_not_safe' };
  }
  if (isProtectedSsotKey(item.key) || isQuarantineKey(item.key)) {
    return { ok: false, reason: 'protected_ssot' };
  }
  return { ok: true };
}

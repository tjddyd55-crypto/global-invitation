import crypto from 'crypto';
import {
  buildInvitationAssetKey,
  getInvitationRootPrefix,
  isInvitationAssetEnvironment,
  normalizeCanonicalInvitationObjectKey,
} from '../invitationAssetKeys';

/**
 * 단일 키 체계: 최종 엔티티 경로는 buildMediaObjectKey, 스테이징은 buildTempObjectKey.
 * invitation/{id}/… | template/{id}/… | temp/{session}/… 만 신규 생성한다.
 * User-scoped SSOT: invitation/{environment}/users/{userId}/invitations/{invitationId}/…
 */

export type MediaScope =
  | 'invitationHero'
  | 'invitationGallery'
  | 'invitationCoupleGroom'
  | 'invitationCoupleBride'
  | 'invitationMusic'
  | 'templateCover'
  | 'templateHero'
  | 'templateAsset'
  | 'common';

export type MediaUsage =
  | 'INVITATION_HERO'
  | 'INVITATION_GALLERY'
  | 'INVITATION_COUPLE_GROOM'
  | 'INVITATION_COUPLE_BRIDE'
  | 'INVITATION_MUSIC'
  | 'TEMPLATE_COVER'
  | 'TEMPLATE_HERO'
  | 'TEMPLATE_ASSET'
  | 'COMMON';

export type BuildMediaObjectKeyParams =
  | {
      scope:
        | 'invitationHero'
        | 'invitationGallery'
        | 'invitationCoupleGroom'
        | 'invitationCoupleBride'
        | 'invitationMusic';
      invitationId: string;
      userId?: string;
      contentType: string;
      filename?: string;
      now?: Date;
    }
  | {
      scope: 'templateCover' | 'templateHero' | 'templateAsset';
      templateId: string;
      contentType: string;
      filename?: string;
      now?: Date;
    }
  | {
      scope: 'common';
      contentType: string;
      filename?: string;
      now?: Date;
    };

export type ParsedMediaObjectKey =
  | { scope: 'invitationHero'; invitationId: string; userId?: string }
  | { scope: 'invitationGallery'; invitationId: string; userId?: string }
  | { scope: 'invitationCoupleGroom'; invitationId: string; userId?: string }
  | { scope: 'invitationCoupleBride'; invitationId: string; userId?: string }
  | { scope: 'invitationMusic'; invitationId: string; userId?: string }
  | { scope: 'templateCover'; templateId: string }
  | { scope: 'templateHero'; templateId: string }
  | { scope: 'templateAsset'; templateId: string }
  | { scope: 'common' };

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

export function resolveFileExtension(contentType: string, filename?: string): string {
  const fromMime = MIME_EXTENSION_MAP[contentType] || '';
  if (fromMime) {
    return fromMime;
  }
  const ext = filename?.split('.').pop() || '';
  const normalized = sanitizeExtension(ext);
  return normalized || 'bin';
}

function buildFileToken(now: Date): string {
  const timestamp = Math.floor(now.getTime() / 1000);
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

/** 모든 확정·스테이징 키에 대해 호출 */
export function logR2Key(key: string): void {
  console.log('[R2_KEY]', key);
}

/**
 * 공유 버킷 격리용 전역 prefix (template/legacy common 등).
 * Global Invitation 사용자 자산 키는 invitationAssetKeys SSOT를 쓰며 R2_KEY_PREFIX를 붙이지 않는다.
 * 예: R2_KEY_PREFIX=development → development/template/...
 */
export function getStorageKeyPrefix(): string {
  const raw = (process.env.R2_KEY_PREFIX || '').trim().replace(/^\/+|\/+$/g, '');
  if (!raw) return '';
  const safe = sanitizeSegment(raw);
  return safe ? `${safe}/` : '';
}

export function applyStorageKeyPrefix(objectKey: string): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const prefix = getStorageKeyPrefix();
  if (!prefix || !normalized || normalized.startsWith(prefix)) {
    return normalized;
  }
  return `${prefix}${normalized}`;
}

export function stripStorageKeyPrefix(objectKey: string): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const prefix = getStorageKeyPrefix();
  if (prefix && normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
  }
  return stripE2EPrefixIfPresent(normalized);
}

/** presign 스테이징: temp/{sessionId}/{timestamp-rand}.ext */
export function buildTempObjectKey(sessionId: string, contentType: string, filename?: string): string {
  const sid = sanitizeSegment(sessionId);
  if (!sid) throw new Error('INVALID_TEMP_SESSION');
  const ext = resolveFileExtension(contentType, filename);
  const token = buildFileToken(new Date());
  const key = applyStorageKeyPrefix(`temp/${sid}/${token}.${ext}`);
  logR2Key(key);
  return key;
}

export function isTempStagingKey(objectKey: string): boolean {
  const relative = normalizeCanonicalInvitationObjectKey(stripStorageKeyPrefix(objectKey));
  const segments = relative.split('/').filter(Boolean);
  if (segments[0] === 'temp' && segments.length >= 3) return true;
  const root = getInvitationRootPrefix();
  // invitation/temp/{userId}/{uploadId}/... (legacy under root without env)
  if (segments[0] === root && segments[1] === 'temp' && segments.length >= 4) return true;
  // invitation/{env}/temp/{userId}/{uploadId}/...
  if (
    segments[0] === root &&
    isInvitationAssetEnvironment(segments[1]) &&
    segments[2] === 'temp' &&
    segments.length >= 5
  ) {
    return true;
  }
  return false;
}

export function buildMediaObjectKey(params: BuildMediaObjectKeyParams): string {
  const now = params.now || new Date();
  const ext = resolveFileExtension(params.contentType, params.filename);
  const tokenFile = `${buildFileToken(now)}.${ext}`;

  let key: string;

  if (
    params.scope === 'invitationHero' ||
    params.scope === 'invitationGallery' ||
    params.scope === 'invitationCoupleGroom' ||
    params.scope === 'invitationCoupleBride' ||
    params.scope === 'invitationMusic'
  ) {
    // Prefer user-scoped SSOT when userId is present; otherwise legacy path for compatibility.
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    const userId = sanitizeSegment(params.userId || '');
    if (userId) {
      const assetType =
        params.scope === 'invitationHero'
          ? 'hero'
          : params.scope === 'invitationGallery'
            ? 'gallery'
            : params.scope === 'invitationCoupleGroom'
              ? 'groom-profile'
              : params.scope === 'invitationCoupleBride'
                ? 'bride-profile'
                : 'user-music';
      return buildInvitationAssetKey({
        userId,
        invitationId,
        assetType,
        contentType: params.contentType,
        filename: params.filename,
      });
    }
    if (params.scope === 'invitationHero') {
      key = `invitation/${invitationId}/hero/original.jpg`;
    } else if (params.scope === 'invitationGallery') {
      const token = buildFileToken(now);
      key = `invitation/${invitationId}/gallery/${token}.${ext}`;
    } else if (params.scope === 'invitationCoupleGroom') {
      key = `invitation/${invitationId}/couple/groom/${tokenFile}`;
    } else if (params.scope === 'invitationCoupleBride') {
      key = `invitation/${invitationId}/couple/bride/${tokenFile}`;
    } else {
      key = `invitation/${invitationId}/music/${tokenFile}`;
    }
  } else if (params.scope === 'templateCover') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    key = `template/${templateId}/thumbnail/main.jpg`;
  } else if (params.scope === 'templateHero') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    key = `template/${templateId}/hero/original.jpg`;
  } else if (params.scope === 'templateAsset') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    const token = buildFileToken(now);
    key = `template/${templateId}/gallery/${token}.${ext}`;
  } else {
    const sessionId = crypto.randomBytes(16).toString('hex');
    key = buildTempObjectKey(sessionId, params.contentType, params.filename);
  }

  key = applyStorageKeyPrefix(key);
  if (params.scope !== 'common') {
    logR2Key(key);
  }
  return key;
}

export function usageFromScope(scope: MediaScope): MediaUsage {
  if (scope === 'invitationHero') return 'INVITATION_HERO';
  if (scope === 'invitationGallery') return 'INVITATION_GALLERY';
  if (scope === 'invitationCoupleGroom') return 'INVITATION_COUPLE_GROOM';
  if (scope === 'invitationCoupleBride') return 'INVITATION_COUPLE_BRIDE';
  if (scope === 'invitationMusic') return 'INVITATION_MUSIC';
  if (scope === 'templateCover') return 'TEMPLATE_COVER';
  if (scope === 'templateHero') return 'TEMPLATE_HERO';
  if (scope === 'templateAsset') return 'TEMPLATE_ASSET';
  return 'COMMON';
}

export function invitationEntityPrefix(invitationId: string): string {
  const id = sanitizeSegment(invitationId);
  if (!id) return '';
  return applyStorageKeyPrefix(`invitation/${id}/`);
}

export function templateEntityPrefix(templateId: string): string {
  const id = sanitizeSegment(templateId);
  if (!id) return '';
  return applyStorageKeyPrefix(`template/${id}/`);
}

function stripE2EPrefixIfPresent(objectKey: string): string {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  if (normalized.startsWith('e2e/')) {
    return normalized.slice('e2e/'.length);
  }
  return normalized;
}

export function parseInvitationOptimizedOriginalKey(objectKey: string): {
  kind: 'hero' | 'gallery';
  invitationId: string;
  assetId: string;
  basePrefix: string;
} | null {
  const normalized = stripStorageKeyPrefix(objectKey);
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] !== 'invitation') return null;

  if (
    segments.length === 4 &&
    segments[2] === 'hero' &&
    segments[3] === 'original.jpg' &&
    segments[1]
  ) {
    const invitationId = segments[1];
    return {
      kind: 'hero',
      invitationId,
      assetId: 'hero',
      basePrefix: `invitation/${invitationId}/hero`,
    };
  }

  if (segments[1] === 'hero' || segments[1] === 'gallery') {
    if (segments.length !== 5 || segments[4] !== 'original.jpg') return null;
    const invitationId = segments[2] || '';
    const assetId = segments[3] || '';
    if (!invitationId || !assetId) return null;
    const kind = segments[1] as 'hero' | 'gallery';
    return {
      kind,
      invitationId,
      assetId,
      basePrefix: `invitation/${kind}/${invitationId}/${assetId}`,
    };
  }

  return null;
}

function parseUserScopedInvitationFolder(
  userId: string,
  invitationId: string,
  folder: string,
  subFolder?: string
): ParsedMediaObjectKey | null {
  if (folder === 'hero') return { scope: 'invitationHero', invitationId, userId };
  if (folder === 'gallery') return { scope: 'invitationGallery', invitationId, userId };
  if (folder === 'music') return { scope: 'invitationMusic', invitationId, userId };
  if (folder === 'couple' && subFolder === 'groom') {
    return { scope: 'invitationCoupleGroom', invitationId, userId };
  }
  if (folder === 'couple' && subFolder === 'bride') {
    return { scope: 'invitationCoupleBride', invitationId, userId };
  }
  return null;
}

function parseEntityInvitationKey(rawSegments: string[]): ParsedMediaObjectKey | null {
  const segments = normalizeCanonicalInvitationObjectKey(rawSegments.join('/'))
    .split('/')
    .filter(Boolean);
  const root = getInvitationRootPrefix();
  if (segments[0] !== root || segments.length < 3) return null;

  // Reject obsolete wrong-order keys if they somehow reach this parser without peel.
  // (They never start with invitation/ so they already fail the root check above.)

  // invitation/{env}/users/{userId}/invitations/{invitationId}/{folder}/...
  if (
    isInvitationAssetEnvironment(segments[1]) &&
    segments[2] === 'users' &&
    segments[4] === 'invitations' &&
    segments[3] &&
    segments[5]
  ) {
    return parseUserScopedInvitationFolder(segments[3], segments[5], segments[6] || '', segments[7]);
  }

  // invitation/{env}/temp/... or invitation/temp/...
  if (segments[1] === 'temp') {
    return { scope: 'common' };
  }
  if (isInvitationAssetEnvironment(segments[1]) && segments[2] === 'temp') {
    return { scope: 'common' };
  }

  // invitation/shared/... — not a user upload target
  if (segments[1] === 'shared') {
    return null;
  }
  if (isInvitationAssetEnvironment(segments[1]) && segments[2] === 'shared') {
    return null;
  }

  // Skip environment segment for invitation/{env}/{id}/hero paths when mis-nested
  const invitationIdOffset = isInvitationAssetEnvironment(segments[1]) ? 2 : 1;
  const invitationId = segments[invitationIdOffset] || '';
  const section = segments[invitationIdOffset + 1] || '';
  if (!invitationId || invitationId === 'users' || invitationId === 'temp' || invitationId === 'shared') {
    return null;
  }
  if (section === 'hero') return { scope: 'invitationHero', invitationId };
  if (section === 'gallery') return { scope: 'invitationGallery', invitationId };
  if (section === 'music') return { scope: 'invitationMusic', invitationId };
  if (section === 'couple' && segments[invitationIdOffset + 2] === 'groom') {
    return { scope: 'invitationCoupleGroom', invitationId };
  }
  if (section === 'couple' && segments[invitationIdOffset + 2] === 'bride') {
    return { scope: 'invitationCoupleBride', invitationId };
  }
  return null;
}

function parseEntityTemplateKey(segments: string[]): ParsedMediaObjectKey | null {
  if (segments[0] !== 'template' || segments.length < 3) return null;
  const templateId = segments[1] || '';
  const section = segments[2] || '';
  if (!templateId) return null;
  if (section === 'hero') return { scope: 'templateHero', templateId };
  if (section === 'gallery') return { scope: 'templateAsset', templateId };
  if (section === 'thumbnail') return { scope: 'templateCover', templateId };
  return null;
}

/** temp 스테이징(공통 업로드) — 읽기·삭제 정책용 */
function parseTempKeyAsCommon(segments: string[]): ParsedMediaObjectKey | null {
  if (segments[0] === 'temp' && segments.length >= 2) {
    return { scope: 'common' };
  }
  return null;
}

function parseLegacyInvitationKey(segments: string[]): ParsedMediaObjectKey | null {
  if (segments[0] !== 'invitation') return null;

  if ((segments[1] === 'hero' || segments[1] === 'gallery') && segments.length >= 4 && segments[2]) {
    const invitationId = segments[2];
    if (segments[1] === 'hero') {
      return { scope: 'invitationHero', invitationId };
    }
    return { scope: 'invitationGallery', invitationId };
  }

  if (segments[1] === 'invitations' && segments.length === 4) {
    const invitationId = segments[2] || '';
    const file = segments[3] || '';
    if (!invitationId || !file) return null;
    if (file.startsWith('hero-')) return { scope: 'invitationHero', invitationId };
    if (file.startsWith('gallery-')) {
      return { scope: 'invitationGallery', invitationId };
    }
    return null;
  }

  if (segments[1] === 'templates' && segments.length === 4) {
    const templateId = segments[2] || '';
    const file = segments[3] || '';
    if (!templateId || !file) return null;
    if (file.startsWith('cover-')) return { scope: 'templateCover', templateId };
    if (file.startsWith('asset-')) return { scope: 'templateAsset', templateId };
    return null;
  }

  if (segments[1] === 'thumbnails' && segments.length === 3) {
    const file = segments[2] || '';
    const mainMatch = /^([a-zA-Z0-9_-]+)\.jpg$/i.exec(file);
    if (mainMatch && !file.startsWith('thumb_')) {
      return { scope: 'templateCover', templateId: mainMatch[1] };
    }
    const companionMatch = /^thumb_([a-zA-Z0-9_-]+)\.jpg$/i.exec(file);
    if (companionMatch) {
      return { scope: 'templateCover', templateId: companionMatch[1] };
    }
    return null;
  }

  if (segments[1] === 'temp' && segments.length === 3) {
    const file = segments[2] || '';
    if (file.includes('-common-') || /-user-/.test(file)) {
      return { scope: 'common' };
    }
  }

  return null;
}

export function parseMediaObjectKey(objectKey: string): ParsedMediaObjectKey | null {
  // stripStorageKeyPrefix handles legacy `{R2_KEY_PREFIX}/...` for non-invitation keys.
  // Invitation user keys must be canonical: invitation/{env}/users/...
  // Obsolete wrong-order keys (`{env}/invitation/...`) are not rewritten and do not parse.
  const normalized = normalizeCanonicalInvitationObjectKey(stripStorageKeyPrefix(objectKey));
  const segments = normalized.split('/').filter(Boolean);

  const tempCommon = parseTempKeyAsCommon(segments);
  if (tempCommon) {
    return tempCommon;
  }

  const entityInv = parseEntityInvitationKey(segments);
  if (entityInv) {
    return entityInv;
  }

  const templateEntity = parseEntityTemplateKey(segments);
  if (templateEntity) {
    return templateEntity;
  }

  const invitationParsed = parseLegacyInvitationKey(segments);
  if (invitationParsed) {
    return invitationParsed;
  }

  if (segments.length < 4) return null;

  if (segments[0] === 'invitations' && segments[2] === 'hero') {
    return { scope: 'invitationHero', invitationId: segments[1] || '' };
  }
  if (segments[0] === 'invitations' && segments[2] === 'gallery') {
    return { scope: 'invitationGallery', invitationId: segments[1] || '' };
  }
  if (segments[0] === 'templates' && segments[2] === 'cover') {
    return { scope: 'templateCover', templateId: segments[1] || '' };
  }
  if (segments[0] === 'templates' && segments[2] === 'assets') {
    return { scope: 'templateAsset', templateId: segments[1] || '' };
  }
  if (segments[0] === 'common' && segments.length >= 4) {
    return { scope: 'common' };
  }

  return null;
}

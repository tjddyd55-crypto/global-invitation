import crypto from 'crypto';

/**
 * 단일 키 체계: 최종 엔티티 경로는 buildMediaObjectKey, 스테이징은 buildTempObjectKey.
 * invitation/{id}/… | template/{id}/… | temp/{session}/… 만 신규 생성한다.
 */

export type MediaScope =
  | 'invitationHero'
  | 'invitationGallery'
  | 'templateCover'
  | 'templateHero'
  | 'templateAsset'
  | 'common';

export type MediaUsage =
  | 'INVITATION_HERO'
  | 'INVITATION_GALLERY'
  | 'TEMPLATE_COVER'
  | 'TEMPLATE_HERO'
  | 'TEMPLATE_ASSET'
  | 'COMMON';

export type BuildMediaObjectKeyParams =
  | {
      scope: 'invitationHero' | 'invitationGallery';
      invitationId: string;
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
  | { scope: 'invitationHero'; invitationId: string }
  | { scope: 'invitationGallery'; invitationId: string }
  | { scope: 'templateCover'; templateId: string }
  | { scope: 'templateHero'; templateId: string }
  | { scope: 'templateAsset'; templateId: string }
  | { scope: 'common' };

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
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

/** presign 스테이징: temp/{sessionId}/{timestamp-rand}.ext */
export function buildTempObjectKey(sessionId: string, contentType: string, filename?: string): string {
  const sid = sanitizeSegment(sessionId);
  if (!sid) throw new Error('INVALID_TEMP_SESSION');
  const ext = resolveFileExtension(contentType, filename);
  const token = buildFileToken(new Date());
  const key = `temp/${sid}/${token}.${ext}`;
  logR2Key(key);
  return key;
}

export function isTempStagingKey(objectKey: string): boolean {
  const segments = objectKey.trim().replace(/^\/+/, '').split('/').filter(Boolean);
  return segments[0] === 'temp' && segments.length >= 3;
}

export function buildMediaObjectKey(params: BuildMediaObjectKeyParams): string {
  const now = params.now || new Date();
  const ext = resolveFileExtension(params.contentType, params.filename);
  const tokenFile = `${buildFileToken(now)}.${ext}`;

  let key: string;

  if (params.scope === 'invitationHero') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    key = `invitation/${invitationId}/hero/original.jpg`;
  } else if (params.scope === 'invitationGallery') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    const token = buildFileToken(now);
    key = `invitation/${invitationId}/gallery/${token}.${ext}`;
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

  if (params.scope !== 'common') {
    logR2Key(key);
  }
  return key;
}

export function usageFromScope(scope: MediaScope): MediaUsage {
  if (scope === 'invitationHero') return 'INVITATION_HERO';
  if (scope === 'invitationGallery') return 'INVITATION_GALLERY';
  if (scope === 'templateCover') return 'TEMPLATE_COVER';
  if (scope === 'templateHero') return 'TEMPLATE_HERO';
  if (scope === 'templateAsset') return 'TEMPLATE_ASSET';
  return 'COMMON';
}

export function invitationEntityPrefix(invitationId: string): string {
  const id = sanitizeSegment(invitationId);
  if (!id) return '';
  return `invitation/${id}/`;
}

export function templateEntityPrefix(templateId: string): string {
  const id = sanitizeSegment(templateId);
  if (!id) return '';
  return `template/${id}/`;
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
  const normalized = objectKey.trim().replace(/^\/+/, '');
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

function parseEntityInvitationKey(segments: string[]): ParsedMediaObjectKey | null {
  if (segments[0] !== 'invitation' || segments.length < 3) return null;
  const invitationId = segments[1] || '';
  const section = segments[2] || '';
  if (!invitationId) return null;
  if (section === 'hero') return { scope: 'invitationHero', invitationId };
  if (section === 'gallery') return { scope: 'invitationGallery', invitationId };
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
  const normalized = stripE2EPrefixIfPresent(objectKey);
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

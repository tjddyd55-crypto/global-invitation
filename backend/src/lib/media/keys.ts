import crypto from 'crypto';
import { buildR2Key } from '../mediaKeyBuilder';

export type MediaScope =
  | 'invitationHero'
  | 'invitationGallery'
  | 'templateCover'
  | 'templateAsset'
  | 'common';

export type MediaUsage =
  | 'INVITATION_HERO'
  | 'INVITATION_GALLERY'
  | 'TEMPLATE_COVER'
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
      scope: 'templateCover' | 'templateAsset';
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

function resolveFileExtension(contentType: string, filename?: string): string {
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

export function buildMediaObjectKey(params: BuildMediaObjectKeyParams): string {
  const now = params.now || new Date();
  const ext = resolveFileExtension(params.contentType, params.filename);
  const tokenFile = `${buildFileToken(now)}.${ext}`;

  if (params.scope === 'invitationHero') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    const assetId = sanitizeSegment(`${buildFileToken(now)}`.replace(/[^a-zA-Z0-9_-]/g, '')) || crypto.randomBytes(8).toString('hex');
    return `invitation/hero/${invitationId}/${assetId}/original.jpg`;
  }
  if (params.scope === 'invitationGallery') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    const assetId = sanitizeSegment(`${buildFileToken(now)}`.replace(/[^a-zA-Z0-9_-]/g, '')) || crypto.randomBytes(8).toString('hex');
    return `invitation/gallery/${invitationId}/${assetId}/original.jpg`;
  }
  if (params.scope === 'templateCover') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    return buildR2Key({ type: 'template', id: templateId, filename: `cover-${tokenFile}` });
  }
  if (params.scope === 'templateAsset') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    return buildR2Key({ type: 'template', id: templateId, filename: `asset-${tokenFile}` });
  }

  const tempId = crypto.randomBytes(16).toString('hex');
  return buildR2Key({ type: 'temp', id: tempId, filename: `common-${tokenFile}` });
}

export function usageFromScope(scope: MediaScope): MediaUsage {
  if (scope === 'invitationHero') return 'INVITATION_HERO';
  if (scope === 'invitationGallery') return 'INVITATION_GALLERY';
  if (scope === 'templateCover') return 'TEMPLATE_COVER';
  if (scope === 'templateAsset') return 'TEMPLATE_ASSET';
  return 'COMMON';
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
  if (segments[1] !== 'hero' && segments[1] !== 'gallery') return null;
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

function parseNewInvitationPrefixedKey(segments: string[]): ParsedMediaObjectKey | null {
  if (segments[0] !== 'invitation') return null;

  if (
    (segments[1] === 'hero' || segments[1] === 'gallery') &&
    segments.length >= 4 &&
    segments[2] &&
    segments[3]
  ) {
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
    if (file.startsWith('gallery-')) return { scope: 'invitationGallery', invitationId };
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

  const modern = parseNewInvitationPrefixedKey(segments);
  if (modern) {
    return modern;
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

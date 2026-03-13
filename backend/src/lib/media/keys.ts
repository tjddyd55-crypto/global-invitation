import crypto from 'crypto';

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
  const fileName = `${buildFileToken(now)}.${ext}`;

  if (params.scope === 'invitationHero') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    return `invitations/${invitationId}/hero/${fileName}`;
  }
  if (params.scope === 'invitationGallery') {
    const invitationId = sanitizeSegment(params.invitationId);
    if (!invitationId) throw new Error('INVALID_MEDIA_OWNER');
    return `invitations/${invitationId}/gallery/${fileName}`;
  }
  if (params.scope === 'templateCover') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    return `templates/${templateId}/cover/${fileName}`;
  }
  if (params.scope === 'templateAsset') {
    const templateId = sanitizeSegment(params.templateId);
    if (!templateId) throw new Error('INVALID_MEDIA_OWNER');
    return `templates/${templateId}/assets/${fileName}`;
  }

  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `common/${yyyy}/${mm}/${fileName}`;
}

export function usageFromScope(scope: MediaScope): MediaUsage {
  if (scope === 'invitationHero') return 'INVITATION_HERO';
  if (scope === 'invitationGallery') return 'INVITATION_GALLERY';
  if (scope === 'templateCover') return 'TEMPLATE_COVER';
  if (scope === 'templateAsset') return 'TEMPLATE_ASSET';
  return 'COMMON';
}

export function parseMediaObjectKey(objectKey: string): ParsedMediaObjectKey | null {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);
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

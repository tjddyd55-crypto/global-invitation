/**
 * R2 객체 키는 항상 `invitation/` 접두사 아래에 둔다 (region path·무작위 루트 금지).
 */

export type R2KeyType = 'template' | 'invitation' | 'thumbnail' | 'temp';

function sanitizeId(id: string): string {
  const normalized = id.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!normalized) {
    throw new Error('INVALID_R2_KEY_ID');
  }
  return normalized;
}

function sanitizeFilename(filename: string): string {
  const base = filename.trim().replace(/\\/g, '/').split('/').pop() || '';
  if (!base || base.includes('..')) {
    throw new Error('INVALID_R2_FILENAME');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(base)) {
    throw new Error('INVALID_R2_FILENAME');
  }
  return base;
}

export function buildR2Key(params: {
  type: R2KeyType;
  id: string;
  filename: string;
}): string {
  const id = sanitizeId(params.id);

  switch (params.type) {
    case 'template': {
      const filename = sanitizeFilename(params.filename);
      return `invitation/templates/${id}/${filename}`;
    }
    case 'invitation': {
      const filename = sanitizeFilename(params.filename);
      return `invitation/invitations/${id}/${filename}`;
    }
    case 'thumbnail':
      return `invitation/thumbnails/${id}.jpg`;
    case 'temp': {
      const filename = sanitizeFilename(params.filename);
      return `invitation/temp/${id}-${filename}`;
    }
    default:
      throw new Error('INVALID_R2_TYPE');
  }
}

/** 템플릿 썸네일 보조(작은 이미지) — 메인 `invitation/thumbnails/{id}.jpg` 와 쌍 */
export function buildR2ThumbnailCompanionKey(entityId: string): string {
  const id = sanitizeId(entityId);
  return `invitation/thumbnails/thumb_${id}.jpg`;
}

export function mapScopeToType(scope: string): R2KeyType {
  const s = scope.toLowerCase();
  if (s.includes('thumbnail')) return 'thumbnail';
  if (s.includes('template')) return 'template';
  if (s.includes('invitation')) return 'invitation';
  return 'temp';
}

function normalizePublicBase(): string {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim() || '';
  if (!base) {
    throw new Error('R2_STORAGE_NOT_CONFIGURED');
  }
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.startsWith('http://') ? trimmed.replace('http://', 'https://') : trimmed;
}

/** DB·API에 저장하는 공개 URL (`?v=` 쿼리 없음, CDN 직접 경로) */
export function buildCanonicalPublicUrl(objectKey: string): string {
  const base = normalizePublicBase();
  const key = objectKey.replace(/^\/+/, '');
  return `${base}/${key}`;
}

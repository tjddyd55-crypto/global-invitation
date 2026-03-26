/**
 * 레거시 호환: buildR2Key 는 temp/{session}/{filename} 만 생성합니다.
 * 신규 코드는 lib/media/keys.ts 의 buildTempObjectKey / buildMediaObjectKey 를 사용하세요.
 */

export type R2KeyType = 'temp';

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

/** @deprecated keys.buildTempObjectKey 사용 권장 */
export function buildR2Key(params: { type: 'temp'; id: string; filename: string }): string {
  const id = sanitizeId(params.id);
  const filename = sanitizeFilename(params.filename);
  const key = `temp/${id}/${filename}`;
  console.log('[R2_KEY]', key);
  return key;
}

/** @deprecated */
export function buildR2ThumbnailCompanionKey(entityId: string): string {
  const id = sanitizeId(entityId);
  return `invitation/thumbnails/thumb_${id}.jpg`;
}

export function mapScopeToType(scope: string): R2KeyType {
  void scope;
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

export function buildCanonicalPublicUrl(objectKey: string): string {
  const base = normalizePublicBase();
  const key = objectKey.replace(/^\/+/, '');
  return `${base}/${key}`;
}

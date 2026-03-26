/**
 * 비엔티티 임시 업로드만 `invitation/temp/...` 를 사용합니다.
 * 초대장·템플릿 본문 경로는 `lib/media/keys.ts` 의 entity 규칙을 사용합니다.
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

/** presign 직전 스테이징 등: `invitation/temp/{session}/{file}` */
export function buildR2Key(params: { type: 'temp'; id: string; filename: string }): string {
  const id = sanitizeId(params.id);
  const filename = sanitizeFilename(params.filename);
  return `invitation/temp/${id}/${filename}`;
}

/** @deprecated 구버전 `invitation/thumbnails/thumb_{id}.jpg` — 신규는 `template/{id}/thumbnail/thumb.jpg` */
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

/** DB·API에 저장하는 공개 URL (`?v=` 쿼리 없음, CDN 직접 경로) */
export function buildCanonicalPublicUrl(objectKey: string): string {
  const base = normalizePublicBase();
  const key = objectKey.replace(/^\/+/, '');
  return `${base}/${key}`;
}

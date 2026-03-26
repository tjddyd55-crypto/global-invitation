/**
 * R2 입출력 얇은 레이어. 경로 규칙·스테이징 확정은 mediaService / lib/media/keys 가 담당합니다.
 */
import {
  buildMediaObjectKey,
  invitationEntityPrefix,
  resolveFileExtension,
  templateEntityPrefix,
} from '../lib/media/keys';
import { buildCanonicalPublicUrl } from '../lib/mediaKeyBuilder';
import { resolveKeyFromPublicUrl } from '../lib/storage/r2Client';
import { deleteFile, deleteFilesByPrefix, uploadFile } from '../lib/storage/uploadToR2';

export type MediaContext = 'invitation' | 'template' | 'user';
export type MediaAssetType = 'asset' | 'thumbnail' | 'hero' | 'gallery';

export type UploadImageParams = {
  fileBuffer: Buffer;
  mimeType: string;
  context: MediaContext;
  entityId: string;
  userId: string;
  creatorId?: string;
  assetType?: MediaAssetType;
};

export type UploadImageResult = {
  url: string;
  key: string;
  mimeType: string;
  fileSize: number;
};

export function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').trim();
}

function normalizeFolder(prefix: string): string {
  return prefix
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

/**
 * 멀티파트 단일 업로드는 common 만 허용. 초대장·템플릿은 presign+confirm 을 사용합니다.
 */
export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  if (params.context !== 'user') {
    throw new Error('USE_PRESIGN_UPLOAD');
  }
  const contentType = params.mimeType.split(';')[0].trim().toLowerCase();
  const filename = `upload.${resolveFileExtension(contentType)}`;
  const key = buildMediaObjectKey({
    scope: 'common',
    contentType,
    filename,
  });
  const url = await uploadFile(params.fileBuffer, key, contentType);
  console.log('[R2_KEY]', key);
  return {
    url,
    key,
    mimeType: contentType,
    fileSize: params.fileBuffer.byteLength,
  };
}

export function getPublicUrlForKey(key: string): string {
  console.log('[R2_KEY]', key);
  return buildCanonicalPublicUrl(key);
}

export async function deleteMediaObjectKey(key: string): Promise<void> {
  console.log('[R2_KEY]', key);
  await deleteFile(key);
}

/**
 * 단일 객체 삭제 또는 접두사 단위 삭제(`…/` 로 끝나는 키는 해당 prefix 하위 전체).
 */
export async function deleteStoredMediaByObjectKey(objectKey: string): Promise<void> {
  const normalized = objectKey.trim().replace(/^\/+/, '');
  if (!normalized) {
    return;
  }
  if (normalized.endsWith('/')) {
    await deleteStoragePrefix(normalized.replace(/\/+$/, ''));
    return;
  }
  await deleteMediaObjectKey(normalized);
}

export async function deleteStoragePrefix(prefix: string): Promise<number> {
  const normalized = normalizeFolder(prefix);
  return deleteFilesByPrefix(`${normalized}/`);
}

export async function deleteImageByUrl(fileUrl: string): Promise<boolean> {
  const normalized = fileUrl.trim();
  if (!normalized) return false;
  const key = resolveKeyFromPublicUrl(normalized.split('?')[0]);
  if (!key) return false;
  await deleteMediaObjectKey(key);
  return true;
}

export function resolveStorageKeyFromUrl(fileUrl: string): string | null {
  return resolveKeyFromPublicUrl(fileUrl.split('?')[0]);
}

export { invitationEntityPrefix, templateEntityPrefix };

'use client';

import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type UploadedMediaFile = {
  url: string;
  fileKey: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  mimeType: string;
  fileSize: number;
};

export type MediaUploadContext = 'invitation' | 'template' | 'user';
export type MediaUploadAssetType = 'asset' | 'thumbnail' | 'hero' | 'gallery';

type UploadMediaOptions = {
  context?: MediaUploadContext;
  entityId?: string;
  assetType?: MediaUploadAssetType;
  onProgress?: (value: number) => void;
};

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
  }
}

function resolveDefaultUploadOptions(): UploadMediaOptions {
  if (typeof window === 'undefined') {
    return { context: 'user' };
  }

  const pathname = window.location.pathname;
  const creatorMatch = pathname.match(/^\/creator\/templates\/([^/]+)\/studio$/);
  if (creatorMatch) {
    return {
      context: 'template',
      entityId: creatorMatch[1],
      assetType: 'asset',
    };
  }

  const invitationMatch = pathname.match(/^\/editor\/([^/]+)$/);
  if (invitationMatch) {
    return {
      context: 'invitation',
      entityId: invitationMatch[1],
      assetType: 'gallery',
    };
  }

  const messageInvitationMatch = pathname.match(/^\/message\/editor\/([^/]+)$/);
  if (messageInvitationMatch) {
    return {
      context: 'invitation',
      entityId: messageInvitationMatch[1],
      assetType: 'gallery',
    };
  }

  const brandedMessageInvitationMatch = pathname.match(/^\/message\/branded\/editor\/([^/]+)$/);
  if (brandedMessageInvitationMatch) {
    return {
      context: 'invitation',
      entityId: brandedMessageInvitationMatch[1],
      assetType: 'gallery',
    };
  }

  return { context: 'user', assetType: 'asset' };
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').trim();
}

function resolveUploadFolder(options: UploadMediaOptions): string {
  const context = options.context || 'user';
  const assetType = options.assetType || 'asset';
  const entityId = sanitizePathSegment(options.entityId || '');

  if (context === 'invitation') {
    if (!entityId) throw new Error('INVALID_MEDIA_PATH');
    return `invitations/${entityId}/${assetType === 'hero' ? 'hero' : 'gallery'}`;
  }

  if (context === 'template') {
    if (!entityId) throw new Error('INVALID_MEDIA_PATH');
    if (assetType === 'thumbnail') {
      return `templates/thumbnails/${entityId}`;
    }
    return `creator/self/${entityId}/assets`;
  }

  return 'users/self';
}

type ApiFailure = {
  status: number;
  errorCode: string;
};

function normalizeApiFailure(status: number, payload: { error?: string } | null): ApiFailure {
  return {
    status,
    errorCode: payload?.error || 'UNKNOWN_ERROR',
  };
}

function throwFriendlyUploadError(failure: ApiFailure): never {
  if (failure.errorCode === 'AUTH_REQUIRED') {
    throw new Error('이미지 업로드는 로그인 후 사용할 수 있습니다.');
  }
  if (failure.errorCode === 'FILE_TOO_LARGE') {
    throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
  }
  if (failure.errorCode === 'R2_STORAGE_NOT_CONFIGURED') {
    throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (failure.errorCode === 'UNSUPPORTED_MEDIA_TYPE' || failure.errorCode === 'INVALID_MEDIA_FILE') {
    throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
  }
  if (failure.errorCode === 'INVALID_MEDIA_PATH' || failure.errorCode === 'INVALID_MEDIA_FOLDER') {
    throw new Error('이미지 업로드 경로가 올바르지 않습니다.');
  }
  throw new Error('이미지 업로드에 실패했습니다.');
}

async function requestPresignedUpload(folder: string, file: File): Promise<{ uploadUrl: string; fileKey: string }> {
  const response = await fetch(buildApiUrl('/api/media/presign'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      folder,
      contentType: file.type,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw normalizeApiFailure(response.status, payload);
  }

  return response.json() as Promise<{ uploadUrl: string; fileKey: string }>;
}

async function uploadToR2Direct(
  uploadUrl: string,
  file: File,
  onProgress?: (value: number) => void
): Promise<void> {
  onProgress?.(0);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const rawPercent = Math.round((event.loaded / event.total) * 100);
      const normalized = Math.min(95, Math.max(0, rawPercent));
      onProgress?.(normalized);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(95);
        resolve();
        return;
      }
      reject(new Error(`DIRECT_UPLOAD_FAILED:${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('DIRECT_UPLOAD_NETWORK_ERROR'));
    xhr.onabort = () => reject(new Error('DIRECT_UPLOAD_ABORTED'));
    xhr.send(file);
  });
}

async function completeDirectUpload(fileKey: string): Promise<UploadedMediaFile> {
  const response = await fetch(buildApiUrl('/api/media/complete'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ fileKey }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw normalizeApiFailure(response.status, payload);
  }

  return response.json() as Promise<UploadedMediaFile>;
}

async function uploadWithFolder(
  file: File,
  folder: string,
  onProgress?: (value: number) => void
): Promise<UploadedMediaFile> {
  const presigned = await requestPresignedUpload(folder, file);
  await uploadToR2Direct(presigned.uploadUrl, file, onProgress);
  const completed = await completeDirectUpload(presigned.fileKey);
  onProgress?.(100);
  return completed;
}

async function uploadViaBackend(file: File, options: UploadMediaOptions): Promise<UploadedMediaFile> {
  const payload = new FormData();
  payload.append('file', file);
  if (options.context) {
    payload.append('context', options.context);
  }
  if (options.entityId) {
    payload.append('entityId', options.entityId);
  }
  if (options.assetType) {
    payload.append('assetType', options.assetType);
  }

  const response = await fetch(buildApiUrl('/api/media/upload'), {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders(),
    body: payload,
  });

  if (!response.ok) {
    const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
    throw normalizeApiFailure(response.status, payloadError);
  }

  return response.json() as Promise<UploadedMediaFile>;
}

async function uploadViaBackendWithFallback(file: File, resolved: UploadMediaOptions): Promise<UploadedMediaFile> {
  try {
    return await uploadViaBackend(file, resolved);
  } catch (error) {
    const failure = error as ApiFailure;
    if (resolved.context === 'invitation' && failure.errorCode === 'UNAUTHORIZED_MEDIA_ACCESS') {
      return uploadViaBackend(file, {
        context: 'user',
        assetType: resolved.assetType || 'asset',
      });
    }
    throw error;
  }
}

function isDirectUploadTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.startsWith('DIRECT_UPLOAD_') ||
    error.message === 'Failed to fetch' ||
    error.message === 'NetworkError when attempting to fetch resource.'
  );
}

export async function uploadMediaImage(file: File, options?: UploadMediaOptions): Promise<UploadedMediaFile> {
  validateImageFile(file);

  const resolved = {
    ...resolveDefaultUploadOptions(),
    ...(options || {}),
  };

  try {
    const folder = resolveUploadFolder(resolved);
    return await uploadWithFolder(file, folder, resolved.onProgress);
  } catch (error) {
    const failure = error as ApiFailure | Error;

    if (isDirectUploadTransportError(error)) {
      try {
        const uploaded = await uploadViaBackendWithFallback(file, resolved);
        resolved.onProgress?.(100);
        return uploaded;
      } catch (legacyError) {
        const legacyFailure = legacyError as ApiFailure | Error;
        if (typeof (legacyFailure as ApiFailure).errorCode === 'string') {
          throwFriendlyUploadError(legacyFailure as ApiFailure);
        }
        throw legacyFailure;
      }
    }

    if (
      resolved.context === 'invitation' &&
      typeof (failure as ApiFailure).errorCode === 'string' &&
      (failure as ApiFailure).errorCode === 'UNAUTHORIZED_MEDIA_ACCESS'
    ) {
      try {
        const fallbackFolder = resolveUploadFolder({
          context: 'user',
          assetType: resolved.assetType || 'asset',
        });
        return await uploadWithFolder(file, fallbackFolder, resolved.onProgress);
      } catch (fallbackError) {
        const fallbackFailure = fallbackError as ApiFailure | Error;
        if (isDirectUploadTransportError(fallbackError)) {
          try {
            const uploaded = await uploadViaBackendWithFallback(file, resolved);
            resolved.onProgress?.(100);
            return uploaded;
          } catch (legacyError) {
            const legacyFailure = legacyError as ApiFailure | Error;
            if (typeof (legacyFailure as ApiFailure).errorCode === 'string') {
              throwFriendlyUploadError(legacyFailure as ApiFailure);
            }
            throw legacyFailure;
          }
        }
        if (typeof (fallbackFailure as ApiFailure).errorCode === 'string') {
          throwFriendlyUploadError(fallbackFailure as ApiFailure);
        }
        throw fallbackFailure;
      }
    }

    if (typeof (failure as ApiFailure).errorCode === 'string') {
      throwFriendlyUploadError(failure as ApiFailure);
    }

    if (failure instanceof Error && failure.message === 'INVALID_MEDIA_PATH') {
      throw new Error('이미지 업로드 경로가 올바르지 않습니다.');
    }

    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

export async function deleteMediaFile(fileUrl: string) {
  const response = await fetch(buildApiUrl('/api/media'), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ url: fileUrl }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (payload?.error === 'AUTH_REQUIRED') {
      throw new Error('이미지 삭제는 로그인 후 사용할 수 있습니다.');
    }
    if (payload?.error === 'R2_STORAGE_NOT_CONFIGURED') {
      throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('이미지 삭제에 실패했습니다.');
  }

  return response.json() as Promise<{ success: true }>;
}

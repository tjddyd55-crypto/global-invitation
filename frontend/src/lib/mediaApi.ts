'use client';

import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';
import { cdnImageSrc } from '@/src/lib/image';
import { compressImage } from '@/src/lib/imageCompression';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type UploadedMediaFile = {
  mediaId?: string;
  objectKey: string;
  publicUrl: string;
  url: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  usage?:
    | 'INVITATION_HERO'
    | 'INVITATION_GALLERY'
    | 'TEMPLATE_COVER'
    | 'TEMPLATE_HERO'
    | 'TEMPLATE_ASSET'
    | 'COMMON';
};

export type MediaUploadContext = 'invitation' | 'template' | 'user';
export type MediaUploadAssetType = 'asset' | 'thumbnail' | 'hero' | 'gallery';
type MediaUploadScope =
  | 'invitationHero'
  | 'invitationGallery'
  | 'templateCover'
  | 'templateHero'
  | 'templateAsset'
  | 'common';
type MediaUsage =
  | 'INVITATION_HERO'
  | 'INVITATION_GALLERY'
  | 'TEMPLATE_COVER'
  | 'TEMPLATE_HERO'
  | 'TEMPLATE_ASSET'
  | 'COMMON';

type UploadMediaOptions = {
  context?: MediaUploadContext;
  entityId?: string;
  assetType?: MediaUploadAssetType;
  onProgress?: (value: number) => void;
};

type ResolvedUploadTarget = {
  scope: MediaUploadScope;
  usage: MediaUsage;
  invitationId?: string;
  templateId?: string;
};

type PresignResponse = {
  objectKey?: string;
  fileKey?: string;
  uploadUrl: string;
  publicUrl?: string;
  url?: string;
  expiresIn?: number;
  usage?: MediaUsage;
};

type ConfirmResponse = {
  mediaId?: string;
  objectKey?: string;
  fileKey?: string;
  publicUrl?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
  usage?: MediaUsage;
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

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  const normalized = String(url).trim();
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith('blob:') || normalized.startsWith('data:image')) {
    return true;
  }

  try {
    const httpsUrl = normalized.startsWith('http://') ? normalized.replace('http://', 'https://') : normalized;
    const parsed = new URL(httpsUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    if (!parsed.pathname || parsed.pathname === '/') {
      return false;
    }
    const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '');
    if (base && httpsUrl.startsWith(base)) {
      return true;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizePublicUrl(url: string): string {
  const normalized = (url || '').trim();
  if (normalized.startsWith('http://')) {
    return normalized.replace('http://', 'https://');
  }
  return normalized;
}

function resolveUploadTarget(options: UploadMediaOptions): ResolvedUploadTarget {
  const context = options.context || 'user';
  const assetType = options.assetType || 'asset';
  const entityId = sanitizePathSegment(options.entityId || '');

  if (context === 'invitation') {
    if (!entityId) throw new Error('INVALID_MEDIA_PATH');
    if (assetType === 'hero') {
      return {
        scope: 'invitationHero',
        usage: 'INVITATION_HERO',
        invitationId: entityId,
      };
    }
    return {
      scope: 'invitationGallery',
      usage: 'INVITATION_GALLERY',
      invitationId: entityId,
    };
  }

  if (context === 'template') {
    if (!entityId) throw new Error('INVALID_MEDIA_PATH');
    if (assetType === 'thumbnail') {
      return {
        scope: 'templateCover',
        usage: 'TEMPLATE_COVER',
        templateId: entityId,
      };
    }
    if (assetType === 'hero') {
      return {
        scope: 'templateHero',
        usage: 'TEMPLATE_HERO',
        templateId: entityId,
      };
    }
    return {
      scope: 'templateAsset',
      usage: 'TEMPLATE_ASSET',
      templateId: entityId,
    };
  }

  return {
    scope: 'common',
    usage: 'COMMON',
  };
}

type ApiFailure = {
  status: number;
  errorCode: string;
  stage: 'PRESIGN' | 'UPLOAD' | 'CONFIRM' | 'DELETE';
};

function normalizeApiFailure(
  stage: ApiFailure['stage'],
  status: number,
  payload: { error?: string } | null
): ApiFailure {
  return {
    status,
    errorCode: payload?.error || 'UNKNOWN_ERROR',
    stage,
  };
}

function throwFriendlyUploadError(failure: ApiFailure): never {
  if (failure.stage === 'PRESIGN') {
    if (failure.errorCode === 'AUTH_REQUIRED') {
      throw new Error('이미지 업로드는 로그인 후 사용할 수 있습니다.');
    }
    if (failure.errorCode === 'UNAUTHORIZED_MEDIA_ACCESS') {
      throw new Error('해당 초대장/템플릿에 업로드 권한이 없습니다.');
    }
    if (failure.errorCode === 'FILE_TOO_LARGE') {
      throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
    }
    if (failure.errorCode === 'R2_STORAGE_NOT_CONFIGURED') {
      throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (failure.errorCode === 'UNSUPPORTED_MEDIA_TYPE') {
      throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
    }
    throw new Error('presign 요청에 실패했습니다.');
  }

  if (failure.stage === 'CONFIRM') {
    if (failure.errorCode === 'MEDIA_OBJECT_NOT_FOUND') {
      throw new Error('업로드된 파일을 스토리지에서 찾지 못했습니다. 다시 업로드해 주세요.');
    }
    if (failure.errorCode === 'UNAUTHORIZED_MEDIA_ACCESS') {
      throw new Error('업로드 완료 처리 권한이 없습니다.');
    }
    if (failure.errorCode === 'R2_STORAGE_NOT_CONFIGURED') {
      throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('업로드 완료 처리(confirm)에 실패했습니다.');
  }

  if (failure.errorCode === 'AUTH_REQUIRED') {
    throw new Error('요청을 처리하려면 로그인이 필요합니다.');
  }
  throw new Error('요청 처리에 실패했습니다.');
}

async function requestPresignedUpload(target: ResolvedUploadTarget, file: File): Promise<PresignResponse> {
  const response = await fetch(buildApiUrl('/api/media/presign'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      scope: target.scope,
      invitationId: target.invitationId,
      templateId: target.templateId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw normalizeApiFailure('PRESIGN', response.status, payload);
  }

  return response.json() as Promise<PresignResponse>;
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
      reject(new Error(`UPLOAD_FAILED:${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('UPLOAD_NETWORK_ERROR'));
    xhr.onabort = () => reject(new Error('UPLOAD_ABORTED'));
    xhr.send(file);
  });
}

async function confirmDirectUpload(params: {
  target: ResolvedUploadTarget;
  objectKey: string;
  publicUrl: string;
  file: File;
}): Promise<ConfirmResponse> {
  const response = await fetch(buildApiUrl('/api/media/confirm'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      objectKey: params.objectKey,
      publicUrl: params.publicUrl,
      contentType: params.file.type,
      size: params.file.size,
      usage: params.target.usage,
      invitationId: params.target.invitationId,
      templateId: params.target.templateId,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw normalizeApiFailure('CONFIRM', response.status, payload);
  }

  return response.json() as Promise<ConfirmResponse>;
}

function normalizeUploadedMedia(confirm: ConfirmResponse): UploadedMediaFile {
  const objectKey = (confirm.objectKey || confirm.fileKey || '').trim();
  const rawUrl = normalizePublicUrl((confirm.publicUrl || confirm.url || '').trim());
  const publicUrl = normalizePublicUrl(cdnImageSrc(rawUrl) || rawUrl);
  const mimeType = (confirm.mimeType || '').trim();
  const fileSize = Number(confirm.fileSize ?? confirm.size ?? 0);

  if (
    !objectKey ||
    !publicUrl ||
    !isValidImageUrl(publicUrl) ||
    !mimeType ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0
  ) {
    throw new Error('CONFIRM_RESPONSE_INVALID');
  }

  return {
    mediaId: confirm.mediaId,
    objectKey,
    publicUrl,
    url: publicUrl,
    fileKey: objectKey,
    mimeType,
    fileSize,
    width: confirm.width ?? null,
    height: confirm.height ?? null,
    usage: confirm.usage,
  };
}

function isUploadTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.startsWith('UPLOAD_FAILED:') ||
    error.message === 'UPLOAD_NETWORK_ERROR' ||
    error.message === 'UPLOAD_ABORTED'
  );
}

export async function uploadMediaImage(file: File, options?: UploadMediaOptions): Promise<UploadedMediaFile> {
  validateImageFile(file);
  const fileToUpload = await compressImage(file);
  validateImageFile(fileToUpload);

  const resolved = {
    ...resolveDefaultUploadOptions(),
    ...(options || {}),
  };
  const target = resolveUploadTarget(resolved);

  let presigned: PresignResponse;
  try {
    presigned = await requestPresignedUpload(target, fileToUpload);
  } catch (error) {
    const failure = error as ApiFailure;
    if (typeof failure.errorCode === 'string') {
      throwFriendlyUploadError(failure);
    }
    throw new Error('presign 요청에 실패했습니다.');
  }

  const uploadUrl = presigned.uploadUrl;
  const objectKey = (presigned.objectKey || presigned.fileKey || '').trim();
  const publicUrl = normalizePublicUrl((presigned.publicUrl || presigned.url || '').trim());
  if (!uploadUrl || !objectKey || !publicUrl) {
    throw new Error('presign 응답이 올바르지 않습니다.');
  }

  try {
    await uploadToR2Direct(uploadUrl, fileToUpload, resolved.onProgress);
    const confirmed = await confirmDirectUpload({
      target,
      objectKey,
      publicUrl,
      file: fileToUpload,
    });
    resolved.onProgress?.(100);
    return normalizeUploadedMedia(confirmed);
  } catch (error) {
    if (isUploadTransportError(error)) {
      throw new Error('R2 업로드(브라우저 PUT)에 실패했습니다.');
    }
    const failure = error as ApiFailure;
    if (typeof failure.errorCode === 'string') {
      throwFriendlyUploadError(failure);
    }
    if (error instanceof Error && error.message === 'CONFIRM_RESPONSE_INVALID') {
      throw new Error('업로드 완료 응답이 올바르지 않습니다.');
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
    const failure = normalizeApiFailure('DELETE', response.status, payload);
    if (failure.errorCode === 'AUTH_REQUIRED') {
      throw new Error('이미지 삭제는 로그인 후 사용할 수 있습니다.');
    }
    if (failure.errorCode === 'R2_STORAGE_NOT_CONFIGURED') {
      throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (failure.errorCode === 'UNAUTHORIZED_MEDIA_ACCESS') {
      throw new Error('이미지 삭제 권한이 없습니다.');
    }
    throw new Error('이미지 삭제에 실패했습니다.');
  }

  return response.json() as Promise<{ success: true }>;
}

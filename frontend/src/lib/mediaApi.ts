'use client';

import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type UploadedMediaFile = {
  url: string;
  mimeType: string;
  fileSize: number;
};

export type MediaUploadContext = 'invitation' | 'template' | 'user';
export type MediaUploadAssetType = 'asset' | 'thumbnail' | 'hero' | 'gallery';

type UploadMediaOptions = {
  context?: MediaUploadContext;
  entityId?: string;
  assetType?: MediaUploadAssetType;
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

export async function uploadMediaImage(file: File, options?: UploadMediaOptions): Promise<UploadedMediaFile> {
  validateImageFile(file);

  const resolved = {
    ...resolveDefaultUploadOptions(),
    ...(options || {}),
  };

  const request = async (requestOptions: UploadMediaOptions) => {
    const payload = new FormData();
    payload.append('file', file);
    if (requestOptions.context) {
      payload.append('context', requestOptions.context);
    }
    if (requestOptions.entityId) {
      payload.append('entityId', requestOptions.entityId);
    }
    if (requestOptions.assetType) {
      payload.append('assetType', requestOptions.assetType);
    }

    return fetch(buildApiUrl('/api/media/upload'), {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders(),
      body: payload,
    });
  };

  let response = await request(resolved);
  let parsedErrorPayload: { error?: string } | null = null;

  if (!response.ok) {
    parsedErrorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
  }

  if (!response.ok && resolved.context === 'invitation') {
    if (parsedErrorPayload?.error === 'UNAUTHORIZED_MEDIA_ACCESS') {
      response = await request({
        context: 'user',
        assetType: resolved.assetType || 'asset',
      });
      parsedErrorPayload = null;
      if (!response.ok) {
        parsedErrorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
      }
    }
  }

  if (!response.ok) {
    const payload = parsedErrorPayload;

    if (payload?.error === 'AUTH_REQUIRED') {
      throw new Error('이미지 업로드는 로그인 후 사용할 수 있습니다.');
    }
    if (payload?.error === 'FILE_TOO_LARGE') {
      throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
    }
    if (payload?.error === 'R2_STORAGE_NOT_CONFIGURED') {
      throw new Error('이미지 저장소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (payload?.error === 'UNSUPPORTED_MEDIA_TYPE' || payload?.error === 'INVALID_MEDIA_FILE') {
      throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
    }

    throw new Error('이미지 업로드에 실패했습니다.');
  }

  return response.json() as Promise<UploadedMediaFile>;
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

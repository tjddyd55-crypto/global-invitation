'use client';

import { buildApiUrl } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type UploadedMediaFile = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
  }
}

export async function uploadMediaImage(file: File): Promise<UploadedMediaFile> {
  validateImageFile(file);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildApiUrl('/api/media/upload'), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (payload?.error === 'AUTH_REQUIRED') {
      throw new Error('이미지 업로드는 로그인 후 사용할 수 있습니다.');
    }
    if (payload?.error === 'FILE_TOO_LARGE') {
      throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
    }
    if (payload?.error === 'UNSUPPORTED_MEDIA_TYPE' || payload?.error === 'INVALID_MEDIA_FILE') {
      throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
    }

    throw new Error('이미지 업로드에 실패했습니다.');
  }

  return response.json() as Promise<UploadedMediaFile>;
}

export async function deleteMediaFile(mediaId: string) {
  const response = await fetch(buildApiUrl(`/api/media/${mediaId}`), {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (payload?.error === 'AUTH_REQUIRED') {
      throw new Error('이미지 삭제는 로그인 후 사용할 수 있습니다.');
    }
    if (payload?.error === 'MEDIA_NOT_FOUND') {
      throw new Error('이미지를 찾을 수 없습니다.');
    }
    throw new Error('이미지 삭제에 실패했습니다.');
  }

  return response.json() as Promise<{ success: true }>;
}

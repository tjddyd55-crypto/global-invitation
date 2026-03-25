'use client';

import imageCompression from 'browser-image-compression';

/**
 * 업로드 직전 브라우저 압축 (목표 ~500KB 이하 · 긴 변 1280px)
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
  };

  const compressed = await imageCompression(file, options);
  if (compressed instanceof File) {
    return compressed.type === 'image/jpeg'
      ? compressed
      : new File([compressed], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  }
  return new File([compressed], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

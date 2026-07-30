const MAX_MUSIC_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MUSIC_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

export function resolveAdminMusicContentType(file: File): string | null {
  const browserType = file.type.toLowerCase();
  if (ALLOWED_MUSIC_TYPES.has(browserType)) return browserType;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'm4a') return 'audio/mp4';
  if (extension === 'aac') return 'audio/aac';
  return null;
}

export function validateAdminMusicFile(file: File | null): string | null {
  if (!file) return '음원 파일을 선택해 주세요.';
  if (!resolveAdminMusicContentType(file)) {
    return 'MP3, M4A, AAC 파일만 업로드할 수 있습니다.';
  }
  if (file.size > MAX_MUSIC_FILE_BYTES) {
    return '파일 크기는 20MB 이하여야 합니다.';
  }
  return null;
}

export function uploadAdminMusicObject(params: {
  uploadUrl: string;
  file: File;
  contentType: string;
  headers?: Record<string, string>;
  onProgress: (progress: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', params.uploadUrl);
    Object.entries(params.headers || { 'Content-Type': params.contentType }).forEach(([key, value]) => {
      request.setRequestHeader(key, value);
    });
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        params.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`음원 업로드에 실패했습니다. (${request.status})`));
    };
    request.onerror = () => reject(new Error('음원 업로드 중 네트워크 오류가 발생했습니다.'));
    request.send(params.file);
  });
}

export function formatMusicBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMusicDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

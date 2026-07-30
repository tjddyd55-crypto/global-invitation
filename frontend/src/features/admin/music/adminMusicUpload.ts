export const MAX_MUSIC_FILE_BYTES = 20 * 1024 * 1024;
export const MIN_PLAYABLE_MUSIC_BYTES = 16 * 1024;

const ALLOWED_MUSIC_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

export type AdminMusicMetadata = {
  durationSeconds: number;
};

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
  if (file.size < MIN_PLAYABLE_MUSIC_BYTES) {
    return '파일이 너무 작아 재생 가능한 음원으로 볼 수 없습니다.';
  }
  if (file.size > MAX_MUSIC_FILE_BYTES) {
    return '파일 크기는 20MB 이하여야 합니다.';
  }
  return null;
}

/**
 * Browser-side playability gate before presign.
 * Backend confirm still re-probes the uploaded object.
 */
export function probeAdminMusicMetadata(file: File): Promise<AdminMusicMetadata> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;

    const cleanup = () => {
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(objectUrl);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('이 파일은 브라우저에서 재생할 수 없는 음악 파일입니다.'));
    };

    const succeed = () => {
      if (settled) return;
      const duration = audio.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        fail();
        return;
      }
      settled = true;
      cleanup();
      resolve({ durationSeconds: Math.max(1, Math.round(duration)) });
    };

    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', succeed);
    audio.addEventListener('error', fail);
    window.setTimeout(fail, 12_000);
    audio.src = objectUrl;
  });
}

export function mapConfirmMusicError(code: string): string {
  switch (code) {
    case 'AUDIO_FILE_TOO_SMALL':
    case 'INVALID_AUDIO_FILE':
    case 'AUDIO_STREAM_NOT_FOUND':
    case 'AUDIO_DURATION_INVALID':
    case 'UNSUPPORTED_AUDIO_TYPE':
      return '재생 가능한 음악 파일이 아닙니다. 정상적인 MP3, M4A 또는 AAC 파일을 선택해 주세요.';
    case 'COMMERCIAL_USE_CONFIRMATION_REQUIRED':
      return '활성화하려면 상업적 이용 권한을 확인해야 합니다.';
    default:
      return code || '음원 등록에 실패했습니다.';
  }
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
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return '확인 불가';
  }
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export type AdminTrackPlayability = 'ok' | 'suspicious' | 'unverified';

export function resolveAdminTrackPlayability(track: {
  fileSize: number;
  durationSeconds: number | null;
}): AdminTrackPlayability {
  if (track.fileSize < MIN_PLAYABLE_MUSIC_BYTES) return 'suspicious';
  if (track.durationSeconds == null || track.durationSeconds <= 0) return 'unverified';
  return 'ok';
}

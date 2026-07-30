export type AudioPlaybackErrorKind =
  | 'ABORTED'
  | 'NETWORK'
  | 'DECODE'
  | 'SRC_NOT_SUPPORTED'
  | 'UNKNOWN';

export function mapMediaErrorCode(code: number | null | undefined): AudioPlaybackErrorKind {
  switch (code) {
    case 1:
      return 'ABORTED';
    case 2:
      return 'NETWORK';
    case 3:
      return 'DECODE';
    case 4:
      return 'SRC_NOT_SUPPORTED';
    default:
      return 'UNKNOWN';
  }
}

export function adminAudioErrorMessage(kind: AudioPlaybackErrorKind): string {
  switch (kind) {
    case 'NETWORK':
      return '음원 파일을 불러오지 못했습니다.';
    case 'DECODE':
      return '음원 파일이 손상되어 재생할 수 없습니다.';
    case 'SRC_NOT_SUPPORTED':
      return '지원되지 않는 음악 형식입니다.';
    case 'ABORTED':
      return '음원 재생이 중단되었습니다.';
    default:
      return '파일이 손상되었거나 지원되지 않는 형식입니다.';
  }
}

export function publicAudioErrorMessage(kind: AudioPlaybackErrorKind): string {
  switch (kind) {
    case 'NETWORK':
      return '음원을 불러오지 못했습니다.';
    case 'DECODE':
    case 'SRC_NOT_SUPPORTED':
      return '음원을 재생할 수 없습니다.';
    default:
      return '음원을 재생할 수 없습니다.';
  }
}

export function logAudioPlaybackFailure(params: {
  trackId?: string;
  publicUrl?: string;
  mediaErrorCode?: number | null;
  rejectionName?: string;
}): void {
  let host = '';
  let path = '';
  try {
    if (params.publicUrl) {
      const parsed = new URL(params.publicUrl);
      host = parsed.host;
      path = parsed.pathname;
    }
  } catch {
    path = '(invalid-url)';
  }
  // eslint-disable-next-line no-console -- intentional non-secret playback diagnostics
  console.warn('[audio-playback]', {
    trackId: params.trackId || null,
    host,
    path,
    mediaErrorCode: params.mediaErrorCode ?? null,
    rejectionName: params.rejectionName || null,
  });
}

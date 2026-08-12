import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';
import { buildAuthHeaders } from '@/src/lib/auth';

export type PublicMusicTrack = {
  id: string;
  title: string;
  artistName: string | null;
  category: 'COMMON' | 'WEDDING' | 'FUNERAL' | 'GENERAL';
  publicUrl: string;
  durationSeconds: number | null;
  attributionText: string | null;
  attributionRequired: boolean;
};

export type MusicLibraryFilters = {
  concept?: 'WEDDING' | 'FUNERAL' | 'GENERAL';
  search?: string;
};

export type MusicLibraryErrorKind = 'auth' | 'network' | 'invalid' | 'unknown';

export class MusicLibraryApiError extends Error {
  readonly kind: MusicLibraryErrorKind;
  readonly status: number | null;
  readonly code: string | null;

  constructor(
    message: string,
    options: { kind: MusicLibraryErrorKind; status?: number | null; code?: string | null } = {
      kind: 'unknown',
    }
  ) {
    super(message);
    this.name = 'MusicLibraryApiError';
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }
}

const RAW_CODE_PATTERN =
  /^(AUTH_REQUIRED|UNAUTHORIZED|INTERNAL_ERROR|MUSIC_LIBRARY_INTERNAL_ERROR|MUSIC_LIBRARY_FETCH_FAILED|INVALID_MUSIC_CONCEPT)$/i;

/**
 * Backend raw code → 사용자용 문구. raw code 그대로 노출 금지.
 */
export function mapMusicLibraryErrorMessage(input: {
  status?: number | null;
  code?: string | null;
  fallback?: string | null;
}): string {
  const status = input.status ?? null;
  const code = (input.code || '').trim();
  const fallback = (input.fallback || '').trim();

  if (status === 401 || /^AUTH_REQUIRED$/i.test(code) || /^UNAUTHORIZED$/i.test(code)) {
    return '음악 목록을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해 주세요.';
  }
  if (status === 400 || /^INVALID_MUSIC_CONCEPT$/i.test(code)) {
    return '음악 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (
    (status !== null && status >= 500) ||
    /^MUSIC_LIBRARY_INTERNAL_ERROR$/i.test(code) ||
    /^INTERNAL_ERROR$/i.test(code) ||
    /^MUSIC_LIBRARY_FETCH_FAILED$/i.test(code)
  ) {
    return '음악 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (fallback && !RAW_CODE_PATTERN.test(fallback)) {
    return fallback;
  }
  return '음악 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

function classifyMusicLibraryError(
  status: number | null,
  code: string | null
): MusicLibraryErrorKind {
  if (status === 401 || /^AUTH_REQUIRED$/i.test(code || '') || /^UNAUTHORIZED$/i.test(code || '')) {
    return 'auth';
  }
  if (status === 400 || /^INVALID_MUSIC_CONCEPT$/i.test(code || '')) {
    return 'invalid';
  }
  if (status !== null && status >= 500) {
    return 'network';
  }
  return 'unknown';
}

export async function fetchMusicLibrary(
  filters: MusicLibraryFilters = {}
): Promise<PublicMusicTrack[]> {
  const params = new URLSearchParams();
  if (filters.concept) params.set('concept', filters.concept);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  const query = params.toString();

  let response: Response;
  try {
    response = await fetch(
      buildApiUrl(`/api/music-library${query ? `?${query}` : ''}`),
      buildRequestInit({
        credentials: 'include',
        cache: 'no-store',
        // Cross-origin development: cookie alone is insufficient — send Bearer like other editor APIs.
        headers: buildAuthHeaders(),
      })
    );
  } catch {
    throw new MusicLibraryApiError(
      mapMusicLibraryErrorMessage({ status: null, code: 'MUSIC_LIBRARY_FETCH_FAILED' }),
      { kind: 'network', status: null, code: 'MUSIC_LIBRARY_FETCH_FAILED' }
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    const code = typeof payload?.error === 'string' ? payload.error : null;
    throw new MusicLibraryApiError(
      mapMusicLibraryErrorMessage({ status: response.status, code }),
      {
        kind: classifyMusicLibraryError(response.status, code),
        status: response.status,
        code,
      }
    );
  }
  return response.json() as Promise<PublicMusicTrack[]>;
}

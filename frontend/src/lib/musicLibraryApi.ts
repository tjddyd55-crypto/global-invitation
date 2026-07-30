import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';

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

export async function fetchMusicLibrary(
  filters: MusicLibraryFilters = {}
): Promise<PublicMusicTrack[]> {
  const params = new URLSearchParams();
  if (filters.concept) params.set('concept', filters.concept);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  const query = params.toString();
  const response = await fetch(
    buildApiUrl(`/api/music-library${query ? `?${query}` : ''}`),
    buildRequestInit({ credentials: 'include', cache: 'no-store' })
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || '음악 라이브러리를 불러오지 못했습니다.');
  }
  return response.json() as Promise<PublicMusicTrack[]>;
}

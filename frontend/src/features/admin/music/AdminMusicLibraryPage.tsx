'use client';
/* eslint-disable i18next/no-literal-string */

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  getAdminMusicSummary,
  listAdminMusic,
  type AdminMusicCategory,
  type AdminMusicSummary,
  type AdminMusicTrack,
} from '@/src/shared/api';
import AdminMusicTrackList from './AdminMusicTrackList';
import AdminMusicUploadForm from './AdminMusicUploadForm';
import { formatMusicBytes } from './adminMusicUpload';
import styles from './AdminMusicLibraryPage.module.css';

type FilterState = {
  search: string;
  category: '' | AdminMusicCategory;
  isActive: '' | 'true' | 'false';
  isArchived: '' | 'true' | 'false';
};

const INITIAL_FILTERS: FilterState = {
  search: '',
  category: '',
  isActive: '',
  isArchived: 'false',
};

function parseOptionalBoolean(value: FilterState['isActive']): boolean | undefined {
  if (!value) return undefined;
  return value === 'true';
}

export default function AdminMusicLibraryPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [tracks, setTracks] = useState<AdminMusicTrack[]>([]);
  const [summary, setSummary] = useState<AdminMusicSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextTracks, nextSummary] = await Promise.all([
        listAdminMusic({
          search: appliedFilters.search,
          category: appliedFilters.category || undefined,
          isActive: parseOptionalBoolean(appliedFilters.isActive),
          isArchived: parseOptionalBoolean(appliedFilters.isArchived),
        }),
        getAdminMusicSummary(),
      ]);
      setTracks(nextTracks);
      setSummary(nextSummary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '음악 라이브러리를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>음악 라이브러리</h1><p>초대장 에디터에서 제공할 공용 음원을 관리합니다.</p></div>
      </header>

      <section className={styles.summaryGrid}>
        <article><span>전체</span><strong>{summary?.total ?? 0}</strong></article>
        <article><span>활성</span><strong>{summary?.active ?? 0}</strong></article>
        <article><span>보관</span><strong>{summary?.archived ?? 0}</strong></article>
        <article><span>총 용량</span><strong>{formatMusicBytes(summary?.totalBytes ?? 0)}</strong></article>
      </section>

      <section className={styles.panel}>
        <h2>필터</h2>
        <form className={styles.filterForm} onSubmit={applyFilters}>
          <input aria-label="검색" placeholder="제목, 아티스트, 설명 검색" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <select aria-label="카테고리" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as FilterState['category'] }))}>
            <option value="">전체 카테고리</option><option>COMMON</option><option>WEDDING</option><option>FUNERAL</option><option>GENERAL</option>
          </select>
          <select aria-label="활성 상태" value={filters.isActive} onChange={(event) => setFilters((current) => ({ ...current, isActive: event.target.value as FilterState['isActive'] }))}>
            <option value="">활성 전체</option><option value="true">활성</option><option value="false">비활성</option>
          </select>
          <select aria-label="보관 상태" value={filters.isArchived} onChange={(event) => setFilters((current) => ({ ...current, isArchived: event.target.value as FilterState['isArchived'] }))}>
            <option value="">보관 전체</option><option value="false">미보관</option><option value="true">보관됨</option>
          </select>
          <button className={styles.primaryButton} type="submit">조회</button>
        </form>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      <AdminMusicUploadForm onUploaded={reload} />
      {isLoading ? <p className={styles.loading}>불러오는 중…</p> : <AdminMusicTrackList tracks={tracks} onChanged={reload} onError={setError} />}
    </div>
  );
}

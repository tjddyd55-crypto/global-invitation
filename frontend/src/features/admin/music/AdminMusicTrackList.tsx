'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import {
  archiveAdminMusic,
  deleteAdminMusic,
  getAdminMusicUsage,
  updateAdminMusic,
  type AdminMusicTrack,
} from '@/src/shared/api';
import {
  claimInvitationMusicPlayback,
  releaseInvitationMusicPlayback,
} from '@/src/invitation/musicPlaybackController';
import { formatMusicBytes, formatMusicDuration } from './adminMusicUpload';
import styles from './AdminMusicLibraryPage.module.css';

type TrackListProps = {
  tracks: AdminMusicTrack[];
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
};

type TrackRowProps = TrackListProps & {
  track: AdminMusicTrack;
  isPlaying: boolean;
  onTogglePlayback: (track: AdminMusicTrack) => void;
};

function AdminMusicTrackRow({
  track,
  isPlaying,
  onTogglePlayback,
  onChanged,
  onError,
}: TrackRowProps) {
  const [title, setTitle] = useState(track.title);
  const [sortOrder, setSortOrder] = useState(String(track.sortOrder));
  const [isActive, setIsActive] = useState(track.isActive);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateAdminMusic(track.id, {
        title: title.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      await onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : '음원 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const showUsage = async () => {
    try {
      const usage = await getAdminMusicUsage(track.id);
      setUsageCount(usage.count);
    } catch (error) {
      onError(error instanceof Error ? error.message : '사용 현황을 조회하지 못했습니다.');
    }
  };

  const archive = async () => {
    if (!window.confirm('이 음원을 보관 처리하시겠습니까?')) return;
    try {
      await archiveAdminMusic(track.id);
      await onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : '보관 처리에 실패했습니다.');
    }
  };

  const remove = async () => {
    if (!window.confirm('이 음원을 삭제하시겠습니까? 사용 중인 음원은 삭제할 수 없습니다.')) return;
    try {
      await deleteAdminMusic(track.id);
      await onChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : '음원 삭제에 실패했습니다.';
      onError(message === 'USAGE_BLOCKED' ? '초대장에서 사용 중인 음원은 삭제할 수 없습니다.' : message);
    }
  };

  return (
    <tr>
      <td><button className={styles.iconButton} type="button" onClick={() => onTogglePlayback(track)}>{isPlaying ? '정지' : '재생'}</button></td>
      <td><input aria-label={`${track.title} 제목`} value={title} onChange={(event) => setTitle(event.target.value)} /><small>{track.artistName || '-'}</small></td>
      <td>{track.category}</td>
      <td>{formatMusicBytes(track.fileSize)}</td>
      <td>{formatMusicDuration(track.durationSeconds)}</td>
      <td><span className={`${styles.badge} ${track.isArchived ? styles.archivedBadge : isActive ? styles.activeBadge : ''}`}>{track.isArchived ? '보관됨' : isActive ? '활성' : '비활성'}</span></td>
      <td><input className={styles.sortInput} type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></td>
      <td><label className={styles.compactCheck}><input type="checkbox" checked={isActive} disabled={track.isArchived} onChange={(event) => setIsActive(event.target.checked)} /> 활성</label></td>
      <td>
        <div className={styles.rowActions}>
          <button type="button" onClick={() => void showUsage()}>사용 {usageCount === null ? '조회' : usageCount}</button>
          <button type="button" disabled={isSaving || track.isArchived} onClick={() => void save()}>저장</button>
          <button type="button" disabled={track.isArchived} onClick={() => void archive()}>보관</button>
          <button className={styles.dangerButton} type="button" onClick={() => void remove()}>삭제</button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminMusicTrackList({ tracks, onChanged, onError }: TrackListProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    stopRef.current = () => {
      audioRef.current?.pause();
      setPlayingId(null);
    };
    return () => {
      releaseInvitationMusicPlayback(stopRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const togglePlayback = (track: AdminMusicTrack) => {
    if (playingId === track.id) {
      stopRef.current?.();
      releaseInvitationMusicPlayback(stopRef.current);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(track.publicUrl);
    audio.preload = 'metadata';
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.addEventListener('pause', () => setPlayingId(null));
    audioRef.current = audio;
    claimInvitationMusicPlayback(stopRef.current);
    void audio.play().then(() => setPlayingId(track.id)).catch(() => onError('음원을 재생할 수 없습니다.'));
  };

  return (
    <section className={styles.panel}>
      <h2>등록된 음원</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>미리듣기</th><th>제목</th><th>카테고리</th><th>크기</th><th>길이</th><th>상태</th><th>순서</th><th>활성</th><th>작업</th></tr></thead>
          <tbody>
            {tracks.map((track) => <AdminMusicTrackRow key={track.id} track={track} tracks={tracks} isPlaying={playingId === track.id} onTogglePlayback={togglePlayback} onChanged={onChanged} onError={onError} />)}
          </tbody>
        </table>
      </div>
      {tracks.length === 0 ? <p className={styles.empty}>조건에 맞는 음원이 없습니다.</p> : null}
    </section>
  );
}

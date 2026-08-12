'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import { getMusicByKey } from '@/src/constants/music';
import {
  logAudioPlaybackFailure,
  mapMediaErrorCode,
  publicAudioErrorMessage,
} from '@/src/invitation/audioPlaybackErrors';
import {
  claimInvitationMusicPlayback,
  releaseInvitationMusicPlayback,
} from '@/src/invitation/musicPlaybackController';
import { fetchMusicLibrary, type PublicMusicTrack } from '@/src/shared/api';
import { musicCategoryForConcept, type InvitationConceptType } from '@/src/invitation/conceptTypes';
import styles from '../weddingEditor.module.css';

type SharedMusicLibraryPickerProps = {
  conceptType: InvitationConceptType;
  selectedTrackId?: string;
  legacyMusicKey?: string;
  onSelect: (track: PublicMusicTrack) => void;
  onError: (message: string) => void;
};

export default function SharedMusicLibraryPicker({
  conceptType,
  selectedTrackId,
  legacyMusicKey,
  onSelect,
  onError,
}: SharedMusicLibraryPickerProps) {
  const [tracks, setTracks] = useState<PublicMusicTrack[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRef.current = () => {
      audioRef.current?.pause();
      setPreviewTrackId(null);
    };
    return () => {
      releaseInvitationMusicPlayback(stopRef.current);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchMusicLibrary({ concept: musicCategoryForConcept(conceptType), search })
        .then((nextTracks) => {
          if (!isCurrent) return;
          // ORGANIZATION: JCI 추천 트랙을 상단으로 (API sortOrder 유지 내에서 보조 정렬).
          if (conceptType === 'ORGANIZATION') {
            setTracks(
              [...nextTracks].sort((a, b) => {
                const aBoost = /jci/i.test(a.title) || /jci/i.test(a.artistName || '') ? 0 : 1;
                const bBoost = /jci/i.test(b.title) || /jci/i.test(b.artistName || '') ? 0 : 1;
                return aBoost - bBoost;
              })
            );
            return;
          }
          setTracks(nextTracks);
        })
        .catch((loadError) => {
          if (isCurrent) {
            setError(loadError instanceof Error ? loadError.message : '제공 음악을 불러오지 못했습니다.');
          }
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    }, 250);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [conceptType, search]);

  const togglePreview = async (track: PublicMusicTrack) => {
    if (previewTrackId === track.id) {
      stopRef.current?.();
      releaseInvitationMusicPlayback(stopRef.current);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('ended', () => setPreviewTrackId(null));
    audio.addEventListener('pause', () => setPreviewTrackId(null));
    audio.addEventListener('error', () => {
      const kind = mapMediaErrorCode(audio.error?.code);
      logAudioPlaybackFailure({
        trackId: track.id,
        publicUrl: track.publicUrl,
        mediaErrorCode: audio.error?.code ?? null,
      });
      setPreviewTrackId(null);
      releaseInvitationMusicPlayback(stopRef.current);
      onError(publicAudioErrorMessage(kind));
    });
    audio.src = track.publicUrl;
    audioRef.current = audio;
    claimInvitationMusicPlayback(stopRef.current);
    try {
      await audio.play();
      setPreviewTrackId(track.id);
    } catch (error) {
      const kind = mapMediaErrorCode(audio.error?.code);
      logAudioPlaybackFailure({
        trackId: track.id,
        publicUrl: track.publicUrl,
        mediaErrorCode: audio.error?.code ?? null,
        rejectionName: error instanceof Error ? error.name : 'PlayRejected',
      });
      setPreviewTrackId(null);
      releaseInvitationMusicPlayback(stopRef.current);
      onError(publicAudioErrorMessage(kind));
    }
  };

  return (
    <div className={styles.musicLibrary}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>제공 음악 검색</span>
        <input type="search" value={search} placeholder="제목 또는 아티스트" onChange={(event) => setSearch(event.target.value)} />
      </label>
      {isLoading ? <p className={styles.helperText}>제공 음악을 불러오는 중…</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {!isLoading && !error && tracks.length === 0 ? (
        <p className={styles.helperText}>등록된 제공 음악이 없습니다. 관리자가 음원을 등록하면 여기에 표시됩니다.</p>
      ) : null}
      <div className={styles.musicLibraryList}>
        {tracks.map((track) => (
          <div key={track.id} className={`${styles.musicLibraryItem} ${selectedTrackId === track.id ? styles.musicLibraryItemSelected : ''}`}>
            <div><strong>{track.title}</strong><span>{track.artistName || track.category}</span>{track.attributionRequired && track.attributionText ? <small>{track.attributionText}</small> : null}</div>
            <div className={styles.musicLibraryActions}>
              <button type="button" onClick={() => void togglePreview(track)}>{previewTrackId === track.id ? '정지' : '미리 듣기'}</button>
              <button type="button" onClick={() => onSelect(track)}>{selectedTrackId === track.id ? '선택됨' : '선택'}</button>
            </div>
          </div>
        ))}
      </div>
      {!selectedTrackId && legacyMusicKey && getMusicByKey(legacyMusicKey) ? (
        <p className={styles.helperText}>기존 제공 음악: {getMusicByKey(legacyMusicKey)?.title}</p>
      ) : null}
    </div>
  );
}

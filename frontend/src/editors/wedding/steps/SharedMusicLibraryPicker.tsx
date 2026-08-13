'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  fetchMusicLibrary,
  MusicLibraryApiError,
  mapMusicLibraryErrorMessage,
  type PublicMusicTrack,
} from '@/src/shared/api';
import { musicCategoryForConcept, type InvitationConceptType } from '@/src/invitation/conceptTypes';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';

type SharedMusicLibraryPickerProps = {
  conceptType: InvitationConceptType;
  selectedTrackId?: string;
  legacyMusicKey?: string;
  onSelect: (track: PublicMusicTrack) => void;
  onError: (message: string) => void;
};

function sortOrganizationTracks(tracks: PublicMusicTrack[]): PublicMusicTrack[] {
  return [...tracks].sort((a, b) => {
    const aBoost = /jci/i.test(a.title) || /jci/i.test(a.artistName || '') ? 0 : 1;
    const bBoost = /jci/i.test(b.title) || /jci/i.test(b.artistName || '') ? 0 : 1;
    return aBoost - bBoost;
  });
}

export default function SharedMusicLibraryPicker({
  conceptType,
  selectedTrackId,
  legacyMusicKey,
  onSelect,
  onError,
}: SharedMusicLibraryPickerProps) {
  const { t } = useInvitationT();
  const [tracks, setTracks] = useState<PublicMusicTrack[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
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
          // Library load failure must never clear selectedTrackId — only replace list on success.
          if (conceptType === 'ORGANIZATION') {
            setTracks(sortOrganizationTracks(nextTracks));
            return;
          }
          setTracks(nextTracks);
        })
        .catch((loadError) => {
          if (!isCurrent) return;
          if (loadError instanceof MusicLibraryApiError) {
            setError(loadError.message);
            return;
          }
          setError(
            mapMusicLibraryErrorMessage({
              fallback: loadError instanceof Error ? loadError.message : null,
            })
          );
          // Keep previous tracks if any; do not wipe invitation selection via onSelect.
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    }, 250);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [conceptType, search, reloadToken]);

  const handleRetry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

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
        <input
          type="search"
          value={search}
          placeholder={t('editor.music.searchPlaceholder')}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {isLoading ? <p className={styles.helperText}>제공 음악을 불러오는 중…</p> : null}
      {error ? (
        <div className={styles.musicLibraryError} data-testid="music-library-error">
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.buttonSubtle} onClick={handleRetry}>
            다시 불러오기
          </button>
        </div>
      ) : null}
      {!isLoading && !error && tracks.length === 0 ? (
        <p className={styles.helperText}>
          등록된 제공 음악이 없습니다. 관리자가 음원을 등록하면 여기에 표시됩니다.
        </p>
      ) : null}
      <div className={styles.musicLibraryList}>
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`${styles.musicLibraryItem} ${selectedTrackId === track.id ? styles.musicLibraryItemSelected : ''}`}
          >
            <div>
              <strong>{track.title}</strong>
              <span>{track.artistName || track.category}</span>
              {track.attributionRequired && track.attributionText ? (
                <small>{track.attributionText}</small>
              ) : null}
            </div>
            <div className={styles.musicLibraryActions}>
              <button type="button" onClick={() => void togglePreview(track)}>
                {previewTrackId === track.id ? t('editor.music.stop') : t('editor.music.preview')}
              </button>
              <button type="button" onClick={() => onSelect(track)}>
                {selectedTrackId === track.id ? t('editor.music.selected') : t('editor.music.select')}
              </button>
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

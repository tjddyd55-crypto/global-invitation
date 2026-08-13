'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useRef, useState } from 'react';
import ToggleRow from '../components/ToggleRow';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras, WeddingEditorMusicSourceType } from '../state/weddingEditor.types';
import { getMusicByKey } from '@/src/constants/music';
import { uploadMediaAudio } from '@/src/lib/mediaApi';
import {
  claimInvitationMusicPlayback,
  releaseInvitationMusicPlayback,
} from '@/src/invitation/musicPlaybackController';
import SharedMusicLibraryPicker from './SharedMusicLibraryPicker';
import type { InvitationConceptType } from '@/src/invitation/conceptTypes';

type Step9MusicSettingsProps = {
  value: WeddingEditorExtras;
  conceptType: InvitationConceptType;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
};

function resolveSourceType(value: WeddingEditorExtras): WeddingEditorMusicSourceType {
  if (value.musicSourceType === 'SHARED' || value.musicSourceType === 'UPLOAD') {
    return value.musicSourceType;
  }
  if ((value.musicFileUrl || '').trim()) return 'UPLOAD';
  return 'SHARED';
}

function hasValidMusicSource(value: WeddingEditorExtras): boolean {
  if ((value.musicFileUrl || '').trim()) return true;
  if ((value.musicTrackId || '').trim()) return true;
  const key = (value.musicKey || '').trim();
  return Boolean(key && getMusicByKey(key));
}

/**
 * 독립 음악 설정 Step — 기본 OFF, 자동재생 없음, 기본 음악 자동 삽입 금지.
 */
export default function Step9MusicSettings({ value, conceptType, onChange }: Step9MusicSettingsProps) {
  const { t } = useInvitationT();
  const musicOn = Boolean(value.musicEnabled);
  const sourceType = resolveSourceType(value);
  const [musicUploading, setMusicUploading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const previewSrc = useMemo(() => {
    if (!musicOn) return '';
    if ((value.musicFileUrl || '').trim()) return value.musicFileUrl!.trim();
    const track = getMusicByKey(value.musicKey);
    return track?.src || '';
  }, [musicOn, value.musicFileUrl, value.musicKey]);

  useEffect(() => {
    stopRef.current = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      setPreviewPlaying(false);
    };
    return () => {
      releaseInvitationMusicPlayback(stopRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewPlaying(false);
  }, [previewSrc]);

  const setSourceType = (next: WeddingEditorMusicSourceType) => {
    if (next === sourceType) return;
    if (next === 'SHARED') {
      onChange({
        musicSourceType: 'SHARED',
        musicTrackId: undefined,
        musicKey: undefined,
        musicFileUrl: undefined,
        musicFileKey: undefined,
      });
      return;
    }
    onChange({
      musicSourceType: 'UPLOAD',
      musicTrackId: undefined,
      musicKey: undefined,
      musicFileUrl: undefined,
      musicFileKey: undefined,
      musicTitle: undefined,
    });
  };

  const togglePreview = async () => {
    if (!previewSrc) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(previewSrc);
      audio.loop = Boolean(value.musicLoop);
      audio.preload = 'metadata';
      audioRef.current = audio;
      audio.addEventListener('ended', () => setPreviewPlaying(false));
      audio.addEventListener('pause', () => setPreviewPlaying(false));
    }

    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
      releaseInvitationMusicPlayback(stopRef.current);
      return;
    }

    claimInvitationMusicPlayback(stopRef.current);
    try {
      const start = value.musicStartAtSeconds ?? 0;
      if (start > 0 && audio.currentTime < 0.5) {
        audio.currentTime = start;
      }
      audio.loop = Boolean(value.musicLoop);
      await audio.play();
      setPreviewPlaying(true);
    } catch {
      setMusicError(t('editor.music.previewFailed'));
      setPreviewPlaying(false);
    }
  };

  return (
    <section className={styles.stepSection} data-testid="editor-music-step">
      <div className={styles.sectionHeader}>
        <h2>{t('editor.section.music')}</h2>
        <p>{t('editor.music.desc')}</p>
      </div>

      <div className={styles.toggleGroup} data-testid="editor-music-settings">
        <ToggleRow
          label={t('editor.music.use')}
          description={t('editor.music.toggleDesc')}
          checked={musicOn}
          testId="editor-music-enabled-toggle"
          onChange={(checked) =>
            onChange({
              musicEnabled: checked,
              // 기본 음악 자동 삽입 금지 — 기존 선택만 유지
              musicSourceType: checked ? resolveSourceType(value) : value.musicSourceType,
            })
          }
        />
      </div>

      {!musicOn ? (
        <p className={styles.helperText} data-testid="editor-music-disabled-hint">
          {t('invitation.placeholder.musicOff')}
        </p>
      ) : (
        <div className={styles.musicPanel}>
          <div className={styles.musicSourceTabs} data-testid="editor-music-source-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sourceType === 'SHARED'}
              className={`${styles.musicSourceTab} ${
                sourceType === 'SHARED' ? styles.musicSourceTabActive : ''
              }`}
              data-testid="editor-music-source-shared"
              onClick={() => setSourceType('SHARED')}
            >
              {t('editor.music.tabRecommended')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceType === 'UPLOAD'}
              className={`${styles.musicSourceTab} ${
                sourceType === 'UPLOAD' ? styles.musicSourceTabActive : ''
              }`}
              data-testid="editor-music-source-upload"
              onClick={() => setSourceType('UPLOAD')}
            >
              {t('editor.music.tabUpload')}
            </button>
          </div>

          {sourceType === 'SHARED' ? (
            <SharedMusicLibraryPicker
              conceptType={conceptType}
              selectedTrackId={value.musicTrackId}
              legacyMusicKey={value.musicKey}
              onError={setMusicError}
              onSelect={(track) =>
                onChange({
                  musicEnabled: true,
                  musicSourceType: 'SHARED',
                  musicTrackId: track.id,
                  musicKey: track.id,
                  musicFileUrl: track.publicUrl,
                  musicTitle: track.title,
                  musicFileKey: undefined,
                })
              }
            />
          ) : (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('editor.music.uploadLabel')}</span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp4,audio/aac,audio/x-m4a,.mp3,.m4a,.aac"
                data-testid="editor-music-upload"
                disabled={musicUploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setMusicUploading(true);
                  setMusicError(null);
                  try {
                    const uploaded = await uploadMediaAudio(file, { assetType: 'music' });
                    onChange({
                      musicEnabled: true,
                      musicSourceType: 'UPLOAD',
                      musicTrackId: undefined,
                      musicKey: undefined,
                      musicFileUrl: uploaded.publicUrl,
                      musicFileKey: uploaded.objectKey,
                      musicTitle: value.musicTitle || file.name.replace(/\.[^.]+$/, ''),
                    });
                  } catch (err) {
                    setMusicError(err instanceof Error ? err.message : t('editor.music.uploadFailed'));
                  } finally {
                    setMusicUploading(false);
                  }
                }}
              />
              {musicUploading ? (
                <p className={styles.helperText} data-testid="editor-music-uploading">
                  {t('editor.upload.uploading')}
                </p>
              ) : null}
              {value.musicFileUrl ? (
                <p className={styles.helperText} data-testid="editor-music-upload-ok">
                  {t('editor.music.uploadOk')}
                </p>
              ) : null}
            </label>
          )}

          {musicError ? <p className={styles.errorText}>{musicError}</p> : null}

          {!hasValidMusicSource(value) ? (
            <p className={styles.helperText} data-testid="editor-music-incomplete-hint">
              {t('editor.music.incompleteHint')}
            </p>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.music.titleLabel')}</span>
            <input
              type="text"
              value={value.musicTitle ?? ''}
              data-testid="editor-music-title"
              onChange={(event) => onChange({ musicTitle: event.target.value })}
              placeholder={t('editor.music.titlePlaceholder')}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.music.startLabel')}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              data-testid="editor-music-start-at"
              value={String(value.musicStartAtSeconds ?? 0)}
              onChange={(event) => {
                const next = event.target.value;
                if (next === '' || /^\d+$/.test(next)) {
                  onChange({ musicStartAtSeconds: next === '' ? 0 : Number(next) });
                }
              }}
            />
          </label>

          <ToggleRow
            label={t('editor.music.loop')}
            description={t('editor.music.loopDesc')}
            checked={Boolean(value.musicLoop)}
            testId="editor-music-loop"
            onChange={(checked) => onChange({ musicLoop: checked })}
          />

          <div className={styles.musicPreviewRow} data-testid="editor-music-preview">
            <button
              type="button"
              className={styles.secondaryButton}
              data-testid="editor-music-preview-toggle"
              disabled={!previewSrc}
              onClick={() => void togglePreview()}
            >
              {previewPlaying ? t('editor.music.stopPreview') : t('editor.music.preview')}
            </button>
            {value.musicTitle || getMusicByKey(value.musicKey)?.title ? (
              <span className={styles.helperText}>
                {value.musicTitle || getMusicByKey(value.musicKey)?.title}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            data-testid="editor-music-clear"
            onClick={() =>
              onChange({
                musicEnabled: false,
                musicSourceType: undefined,
                musicTrackId: undefined,
                musicKey: undefined,
                musicFileUrl: undefined,
                musicFileKey: undefined,
                musicTitle: undefined,
                musicLoop: false,
                musicStartAtSeconds: 0,
              })
            }
          >
            {t('editor.music.clear')}
          </button>
        </div>
      )}
    </section>
  );
}

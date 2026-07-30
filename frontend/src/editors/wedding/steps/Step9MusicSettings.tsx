'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useRef, useState } from 'react';
import ToggleRow from '../components/ToggleRow';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras, WeddingEditorMusicSourceType } from '../state/weddingEditor.types';
import { MUSIC_LIST, getMusicByKey } from '@/src/constants/music';
import { uploadMediaAudio } from '@/src/lib/mediaApi';
import {
  claimInvitationMusicPlayback,
  releaseInvitationMusicPlayback,
} from '@/src/invitation/musicPlaybackController';

type Step9MusicSettingsProps = {
  value: WeddingEditorExtras;
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
  const key = (value.musicKey || '').trim();
  return Boolean(key && getMusicByKey(key));
}

/**
 * 독립 음악 설정 Step — 기본 OFF, 자동재생 없음, 기본 음악 자동 삽입 금지.
 */
export default function Step9MusicSettings({ value, onChange }: Step9MusicSettingsProps) {
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
    if (next === 'SHARED') {
      onChange({
        musicSourceType: 'SHARED',
        musicFileUrl: undefined,
        musicFileKey: undefined,
      });
      return;
    }
    onChange({
      musicSourceType: 'UPLOAD',
      musicKey: undefined,
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
      setMusicError('미리 듣기를 재생할 수 없습니다.');
      setPreviewPlaying(false);
    }
  };

  return (
    <section className={styles.stepSection} data-testid="editor-music-step">
      <div className={styles.sectionHeader}>
        <h2>배경음악 설정</h2>
        <p>초대장을 보는 방문자가 직접 재생할 수 있는 배경음악을 설정합니다.</p>
      </div>

      <div className={styles.toggleGroup} data-testid="editor-music-settings">
        <ToggleRow
          label="배경음악 사용"
          description="OFF면 공개 초대장에 음악 플레이어가 표시되지 않습니다. 기본은 사용하지 않습니다."
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
          배경 음악을 사용하지 않습니다. 켜면 제공 음악 또는 직접 업로드한 파일을 선택할 수 있습니다.
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
              제공 음악
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
              내 음악 업로드
            </button>
          </div>

          {sourceType === 'SHARED' ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>공용 음악 선택</span>
              <select
                value={value.musicKey || ''}
                data-testid="editor-music-select"
                onChange={(event) => {
                  const key = event.target.value;
                  const track = MUSIC_LIST.find((item) => item.musicKey === key);
                  onChange({
                    musicSourceType: 'SHARED',
                    musicKey: key || undefined,
                    musicTitle: track?.title || value.musicTitle,
                    musicFileUrl: undefined,
                    musicFileKey: undefined,
                  });
                }}
              >
                <option value="">선택하세요</option>
                {MUSIC_LIST.map((track) => (
                  <option key={track.musicKey} value={track.musicKey}>
                    {track.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>내 음악 업로드 (MP3/M4A/AAC, 최대 10MB)</span>
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
                      musicKey: undefined,
                      musicFileUrl: uploaded.publicUrl,
                      musicFileKey: uploaded.objectKey,
                      musicTitle: value.musicTitle || file.name.replace(/\.[^.]+$/, ''),
                    });
                  } catch (err) {
                    setMusicError(err instanceof Error ? err.message : '음악 업로드에 실패했습니다.');
                  } finally {
                    setMusicUploading(false);
                  }
                }}
              />
              {musicUploading ? (
                <p className={styles.helperText} data-testid="editor-music-uploading">
                  업로드 중…
                </p>
              ) : null}
              {value.musicFileUrl ? (
                <p className={styles.helperText} data-testid="editor-music-upload-ok">
                  업로드된 음악이 사용됩니다.
                </p>
              ) : null}
            </label>
          )}

          {musicError ? <p className={styles.errorText}>{musicError}</p> : null}

          {!hasValidMusicSource(value) ? (
            <p className={styles.helperText} data-testid="editor-music-incomplete-hint">
              음악을 선택하거나 업로드해야 미리보기·공개 초대장에 플레이어가 표시됩니다.
            </p>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>음악 제목 (선택)</span>
            <input
              type="text"
              value={value.musicTitle ?? ''}
              data-testid="editor-music-title"
              onChange={(event) => onChange({ musicTitle: event.target.value })}
              placeholder="방문자가 보게 될 제목"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>시작 위치 (초)</span>
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
            label="반복 재생"
            description="끝까지 들으면 처음부터 다시 재생합니다."
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
              {previewPlaying ? '미리 듣기 정지' : '미리 듣기'}
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
                musicKey: undefined,
                musicFileUrl: undefined,
                musicFileKey: undefined,
                musicTitle: undefined,
                musicLoop: false,
                musicStartAtSeconds: 0,
              })
            }
          >
            음악 삭제
          </button>
        </div>
      )}
    </section>
  );
}

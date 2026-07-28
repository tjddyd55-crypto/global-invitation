'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import ToggleRow from '../components/ToggleRow';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras } from '../state/weddingEditor.types';
import { MUSIC_LIST } from '@/src/constants/music';
import {
  RSVP_BUTTON_LABEL_MAX_LENGTH,
  clampRsvpButtonLabel,
} from '@/src/invitation/rsvpSettings';
import { uploadMediaAudio } from '@/src/lib/mediaApi';

type Step8ExtrasProps = {
  value: WeddingEditorExtras;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
};

/**
 * 참석/댓글 + 선택형 배경 음악(공유 catalog 또는 사용자 MP3 업로드).
 */
export default function Step8Extras({ value, onChange }: Step8ExtrasProps) {
  const musicOn = Boolean(value.musicEnabled);
  const buttonLabelPreview = clampRsvpButtonLabel(
    value.rsvpButtonText ?? '',
    '참석 여부 알리기'
  );
  const [musicUploading, setMusicUploading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>참석 여부 · 메시지</h2>
        <p>참석 여부와 공개 댓글(축하/추모 메시지) 노출을 설정합니다.</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label="참석 여부"
          description="ON이면 공개 초대장과 미리보기에 참석 여부 섹션이 표시됩니다."
          checked={value.rsvpEnabled}
          testId="editor-rsvp-toggle"
          onChange={(checked) => onChange({ rsvpEnabled: checked })}
        />
        <ToggleRow
          label="댓글·메시지 받기"
          description="OFF 시 공개 초대장의 댓글 섹션을 숨깁니다. (RSVP 메시지와 별개)"
          checked={value.guestbookEnabled}
          testId="editor-comments-toggle"
          onChange={(checked) => onChange({ guestbookEnabled: checked })}
        />
      </div>
      {value.rsvpEnabled && (
        <div className={styles.rsvpButtonField} data-testid="editor-rsvp-button-field">
          <label className={styles.field}>
            <span className={styles.fieldLabel}>공개 초대장 버튼 문구</span>
            <input
              type="text"
              value={value.rsvpButtonText ?? ''}
              maxLength={RSVP_BUTTON_LABEL_MAX_LENGTH}
              data-testid="editor-rsvp-button-label"
              onChange={(event) => onChange({ rsvpButtonText: event.target.value })}
              placeholder="예: 참석 여부 알리기"
            />
          </label>
          <p className={styles.helperText}>
            공개 초대장에 표시되는 참석 여부 CTA 버튼의 문구입니다. 오른쪽 미리보기의 참석 여부
            버튼에 바로 반영됩니다.
          </p>
          <div className={styles.rsvpButtonPreview} data-testid="editor-rsvp-button-preview">
            <span className={styles.rsvpButtonPreviewLabel}>버튼 미리보기</span>
            <div className={styles.rsvpButtonPreviewCta}>{buttonLabelPreview}</div>
          </div>
        </div>
      )}

      <div className={styles.sectionHeader} style={{ marginTop: 28 }}>
        <h2>배경 음악</h2>
        <p>기본은 사용하지 않습니다. 공용 음악 선택 또는 MP3 업로드가 가능합니다.</p>
      </div>

      <div className={styles.toggleGroup} data-testid="editor-music-settings">
        <ToggleRow
          label="배경 음악 사용"
          description="OFF면 공개 초대장에 음악 플레이어가 표시되지 않습니다."
          checked={musicOn}
          onChange={(checked) =>
            onChange({
              musicEnabled: checked,
              musicKey: checked ? value.musicKey || MUSIC_LIST[0]?.musicKey : undefined,
              musicTitle: checked
                ? value.musicTitle ||
                  MUSIC_LIST.find((m) => m.musicKey === (value.musicKey || MUSIC_LIST[0]?.musicKey))
                    ?.title
                : undefined,
            })
          }
        />
      </div>

      {!musicOn ? (
        <p className={styles.helperText} data-testid="editor-music-disabled-hint">
          배경 음악을 사용하지 않습니다. 음악 파일을 추가하면 방문자가 직접 재생할 수 있습니다.
        </p>
      ) : (
        <div className={styles.musicPanel}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>공용 음악 선택</span>
            <select
              value={value.musicFileUrl ? '' : value.musicKey || ''}
              data-testid="editor-music-select"
              onChange={(event) => {
                const key = event.target.value;
                const track = MUSIC_LIST.find((item) => item.musicKey === key);
                onChange({
                  musicKey: key || undefined,
                  musicTitle: track?.title,
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
            {musicUploading ? <p className={styles.helperText}>업로드 중…</p> : null}
            {value.musicFileUrl ? (
              <p className={styles.helperText} data-testid="editor-music-upload-ok">
                업로드된 음악이 사용됩니다.
              </p>
            ) : null}
            {musicError ? <p className={styles.errorText}>{musicError}</p> : null}
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>음악 제목 (선택)</span>
            <input
              type="text"
              value={value.musicTitle ?? ''}
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
            onChange={(checked) => onChange({ musicLoop: checked })}
          />

          <button
            type="button"
            className={styles.secondaryButton}
            data-testid="editor-music-clear"
            onClick={() =>
              onChange({
                musicEnabled: false,
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

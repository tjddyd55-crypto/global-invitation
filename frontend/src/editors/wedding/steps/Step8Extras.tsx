'use client';
/* eslint-disable i18next/no-literal-string */

import ToggleRow from '../components/ToggleRow';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorExtras } from '../state/weddingEditor.types';
import {
  RSVP_BUTTON_LABEL_MAX_LENGTH,
  clampRsvpButtonLabel,
} from '@/src/invitation/rsvpSettings';

type Step8ExtrasProps = {
  value: WeddingEditorExtras;
  onChange: (value: Partial<WeddingEditorExtras>) => void;
};

/**
 * 참석 여부 · 댓글 설정 (음악은 Step9MusicSettings).
 */
export default function Step8Extras({ value, onChange }: Step8ExtrasProps) {
  const buttonLabelPreview = clampRsvpButtonLabel(
    value.rsvpButtonText ?? '',
    '참석 여부 알리기'
  );

  return (
    <section className={styles.stepSection} data-testid="editor-rsvp-step">
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
    </section>
  );
}

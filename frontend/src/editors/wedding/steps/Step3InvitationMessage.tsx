'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorInvitationMessage, WeddingEditorSetup } from '../state/weddingEditor.types';

type Step3InvitationMessageProps = {
  value: WeddingEditorInvitationMessage;
  conceptType: WeddingEditorSetup['conceptType'];
  onChange: (value: Partial<WeddingEditorInvitationMessage>) => void;
};

export default function Step3InvitationMessage({ value, conceptType, onChange }: Step3InvitationMessageProps) {
  const labels =
    conceptType === 'GENERAL'
      ? {
          title: '행사 소개',
          description: '행사 소개 문구를 입력합니다.',
          quote: '강조 문구 (선택)',
          body: '행사 소개',
          placeholder: '행사에 초대드립니다.',
        }
      : {
          title: '인사말',
          description: '인사말 문구를 입력합니다.',
          quote: '인용 문구 (선택)',
          body: '인사말',
          placeholder: '소중한 분들을 모시고\n예식을 올리게 되었습니다.',
        };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{labels.title}</h2>
        <p>{labels.description}</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labels.quote}</span>
        <input
          type="text"
          value={value.quote ?? ''}
          onChange={(event) => onChange({ quote: event.target.value })}
          placeholder="예: 예쁜 예감이 들었다..."
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labels.body}</span>
        <textarea
          rows={6}
          value={value.body}
          onChange={(event) => onChange({ body: event.target.value })}
          placeholder={labels.placeholder}
        />
      </label>
      <div className={styles.noticeBox}>줄바꿈 단위로 문단이 분리되어 미리보기에 반영됩니다.</div>
    </section>
  );
}

'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorInvitationMessage } from '../state/weddingEditor.types';

type Step3InvitationMessageProps = {
  value: WeddingEditorInvitationMessage;
  onChange: (value: Partial<WeddingEditorInvitationMessage>) => void;
};

function toParagraphs(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function Step3InvitationMessage({ value, onChange }: Step3InvitationMessageProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 3. 초대 문구</h2>
        <p>인용 문구와 본문 문단을 입력합니다. 문단은 줄바꿈으로 구분됩니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>인용 문구 (선택)</span>
        <input
          type="text"
          value={value.quote ?? ''}
          onChange={(event) => onChange({ quote: event.target.value })}
          placeholder="예: 예쁜 예감이 들었다..."
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>본문 문단 (2~4개 권장)</span>
        <textarea
          rows={6}
          value={value.body.join('\n')}
          onChange={(event) => onChange({ body: toParagraphs(event.target.value) })}
          placeholder="문단을 줄바꿈으로 구분하세요."
        />
      </label>
      <div className={styles.noticeBox}>문단 추가/삭제가 가능하며, 입력 순서가 초대장에 그대로 반영됩니다.</div>
    </section>
  );
}

'use client';

import styles from '../messageSimpleEditor.module.css';

type Step1ContentProps = {
  title?: string;
  subtitle?: string;
  message: string;
  onChange: (payload: { title?: string; subtitle?: string; message?: string }) => void;
};

export default function Step1Content({ title, subtitle, message, onChange }: Step1ContentProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 1. 제목 / 메시지</h2>
        <p>짧고 간결한 제목과 메시지를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>제목 (선택)</span>
          <input
            type="text"
            value={title ?? ''}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="예: 따뜻한 안부를 전합니다"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>부제 (선택)</span>
          <input
            type="text"
            value={subtitle ?? ''}
            onChange={(event) => onChange({ subtitle: event.target.value })}
            placeholder="예: 김지우 드림"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>메시지</span>
        <textarea
          rows={5}
          value={message}
          onChange={(event) => onChange({ message: event.target.value })}
          placeholder="전달하고 싶은 메시지를 입력하세요."
          required
        />
      </label>
    </section>
  );
}

'use client';

import styles from '../messageCardEditor.module.css';

type Step2ContentProps = {
  title: string;
  subtitle?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  onChange: (payload: {
    title?: string;
    subtitle?: string;
    description?: string;
    eventDate?: string;
    location?: string;
  }) => void;
};

export default function Step2Content({
  title,
  subtitle,
  description,
  eventDate,
  location,
  onChange,
}: Step2ContentProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 2. 메시지 내용</h2>
        <p>제목/부제/설명 및 날짜, 장소를 입력합니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>제목</span>
          <input
            type="text"
            value={title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="예: Thank You"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>부제 (선택)</span>
          <input
            type="text"
            value={subtitle ?? ''}
            onChange={(event) => onChange({ subtitle: event.target.value })}
            placeholder="예: 유동규 ♥ 이소영"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>설명 (선택)</span>
        <textarea
          rows={3}
          value={description ?? ''}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="감사 인사말 또는 짧은 메시지"
        />
      </label>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>날짜 (선택)</span>
          <input
            type="datetime-local"
            value={eventDate ?? ''}
            onChange={(event) => onChange({ eventDate: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>장소 (선택)</span>
          <input
            type="text"
            value={location ?? ''}
            onChange={(event) => onChange({ location: event.target.value })}
            placeholder="예: 더링크호텔 서울"
          />
        </label>
      </div>
    </section>
  );
}

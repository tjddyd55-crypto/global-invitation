'use client';

import styles from '../funeralEditor.module.css';

type Step1MessageProps = {
  message: string;
  onChange: (message: string) => void;
};

export default function Step1Message({ message, onChange }: Step1MessageProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>부고문</h2>
        <p>부고문을 입력합니다. 줄바꿈을 지원합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>부고문</span>
        <textarea
          rows={6}
          value={message}
          onChange={(event) => onChange(event.target.value)}
          placeholder="고인의 명복을 빌어주시고 따뜻한 위로 부탁드립니다."
          required
        />
      </label>
    </section>
  );
}

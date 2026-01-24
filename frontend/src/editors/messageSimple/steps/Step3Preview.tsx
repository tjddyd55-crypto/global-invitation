'use client';

import MessageSimpleCard from '@/src/templates/messageSimple/MessageSimpleCard';
import styles from '../messageSimpleEditor.module.css';
import type { MessageCardSimple } from '@/src/models/messageSimple';

type Step3PreviewProps = {
  data: MessageCardSimple;
};

export default function Step3Preview({ data }: Step3PreviewProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 3. 미리보기</h2>
        <p>실제 카드 화면을 확인합니다.</p>
      </div>
      <div className={styles.previewFull}>
        <MessageSimpleCard data={data} />
      </div>
    </section>
  );
}

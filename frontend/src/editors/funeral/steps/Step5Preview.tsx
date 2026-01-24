'use client';

import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import styles from '../funeralEditor.module.css';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

type Step5PreviewProps = {
  data: FuneralInvitation;
};

export default function Step5Preview({ data }: Step5PreviewProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 5. 미리보기</h2>
        <p>실제 서비스 화면을 확인합니다.</p>
      </div>
      <div className={styles.previewFull}>
        <FuneralClassicInvitation data={data} />
      </div>
    </section>
  );
}

'use client';

import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';
import styles from '../funeralEditor.module.css';

type PreviewPanelProps = {
  data: FuneralInvitation;
};

export default function PreviewPanel({ data }: PreviewPanelProps) {
  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewTitle}>라이브 미리보기</div>
      <div className={styles.previewFrame}>
        <FuneralClassicInvitation data={data} />
      </div>
    </div>
  );
}

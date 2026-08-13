'use client';

import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

type Step5PreviewProps = {
  data: FuneralInvitation;
};

export default function Step5Preview({ data }: Step5PreviewProps) {
  const { t } = useInvitationT();

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>{t('editor.action.preview')}</h2>
        <p>{t('editor.preview.liveHint')}</p>
      </div>
      <div className={styles.previewFull}>
        <FuneralClassicInvitation data={data} />
      </div>
    </section>
  );
}

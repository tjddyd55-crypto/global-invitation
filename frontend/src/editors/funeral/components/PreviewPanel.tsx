'use client';

import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../funeralEditor.module.css';

type PreviewPanelProps = {
  data: FuneralInvitation;
};

export default function PreviewPanel({ data }: PreviewPanelProps) {
  const { t } = useInvitationT();

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewTitle}>{t('editor.preview.live')}</div>
      <div className={styles.previewFrame}>
        <FuneralClassicInvitation data={data} />
      </div>
    </div>
  );
}

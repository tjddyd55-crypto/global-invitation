'use client';

import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import type { WeddingClassicData } from '@/src/templates/weddingClassic/data';
import styles from '../weddingEditor.module.css';

type LivePreviewPanelProps = {
  data: WeddingClassicData;
  showRsvp: boolean;
  showGuestbook: boolean;
  title?: string;
  fullscreen?: boolean;
};

export default function LivePreviewPanel({
  data,
  showRsvp,
  showGuestbook,
  title,
  fullscreen = false,
}: LivePreviewPanelProps) {
  const frameClassName = fullscreen
    ? `${styles.previewFrame} ${styles.previewFrameFullscreen}`
    : styles.previewFrame;

  return (
    <div className={styles.previewPanel}>
      {title && <div className={styles.previewTitle}>{title}</div>}
      <div className={frameClassName}>
        <WeddingClassicInvitation data={data} showRsvp={showRsvp} showGuestbook={showGuestbook} />
      </div>
    </div>
  );
}

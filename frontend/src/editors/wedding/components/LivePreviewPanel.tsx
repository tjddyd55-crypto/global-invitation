'use client';

import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import styles from '../weddingEditor.module.css';

type LivePreviewPanelProps = {
  data: InvitationRuntimeData;
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
        <FullInvitationRenderer data={data} showRsvp={showRsvp} showGuestbook={showGuestbook} />
      </div>
    </div>
  );
}

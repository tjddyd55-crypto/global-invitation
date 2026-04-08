'use client';

import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import styles from '../weddingEditor.module.css';

type LivePreviewPanelProps = {
  data: InvitationRuntimeData;
  title?: string;
  fullscreen?: boolean;
};

export default function LivePreviewPanel({ data, title, fullscreen = false }: LivePreviewPanelProps) {
  const frameClassName = fullscreen
    ? `${styles.previewFrame} ${styles.previewFrameFullscreen}`
    : styles.previewFrame;

  return (
    <div className={styles.previewPanel}>
      {title && <div className={styles.previewTitle}>{title}</div>}
      <div className={frameClassName}>
        <FullInvitationRenderer data={data} />
      </div>
    </div>
  );
}

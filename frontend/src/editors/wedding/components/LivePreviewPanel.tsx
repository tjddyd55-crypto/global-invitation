'use client';

import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import styles from '../weddingEditor.module.css';

type LivePreviewPanelProps = {
  data: InvitationRuntimeData;
  title?: string;
  fullscreen?: boolean;
  /** Figma: “현재 편집 중: {step}” */
  editingStepLabel?: string;
};

/**
 * Figma Desktop LivePreviewPanel — 340px column, phone radius 28.
 */
export default function LivePreviewPanel({
  data,
  title = '실시간 미리보기',
  fullscreen = false,
  editingStepLabel,
}: LivePreviewPanelProps) {
  const frameClassName = fullscreen
    ? `${styles.previewFrame} ${styles.previewFrameFullscreen}`
    : styles.previewFrame;

  return (
    <div className={styles.previewPanel} style={{ width: fullscreen ? undefined : 340 }}>
      {!fullscreen && title ? <p className={styles.previewTitle}>{title}</p> : null}
      <div className={frameClassName}>
        {!fullscreen ? <div className={styles.previewNotch} aria-hidden /> : null}
        <div className={styles.previewScroll}>
          <FullInvitationRenderer data={data} />
        </div>
      </div>
      {!fullscreen && editingStepLabel ? (
        <div className={styles.editingCard}>
          <p>
            현재 편집 중: <strong>{editingStepLabel}</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import { getMusicByKey } from '@/src/constants/music';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
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
 * 음악은 공개와 동일 조건, 자동재생 없음.
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

  const playableMusic = useMemo(
    () =>
      resolvePlayableInvitationMusic(data, (key) => {
        const track = getMusicByKey(key);
        return track ? { src: track.src, title: track.title } : undefined;
      }),
    [data]
  );

  return (
    <div className={styles.previewPanel} style={{ width: fullscreen ? undefined : 340 }}>
      {!fullscreen && title ? <p className={styles.previewTitle}>{title}</p> : null}
      <div className={frameClassName} style={{ position: 'relative' }}>
        {!fullscreen ? <div className={styles.previewNotch} aria-hidden /> : null}
        <div className={styles.previewScroll} data-testid="editor-live-preview-viewport">
          <FullInvitationRenderer data={data} />
        </div>
        {playableMusic ? (
          <div className={styles.previewMusicSlot}>
            <InvitationMusicPlayer music={playableMusic} />
          </div>
        ) : null}
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

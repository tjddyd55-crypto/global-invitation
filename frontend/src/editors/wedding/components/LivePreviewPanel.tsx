/**
 * Figma Desktop LivePreviewPanel — 340px column, phone radius 28.
 * Preview는 draft state 기반 FullInvitationRenderer + previewMode.
 * Step ↔ section scroll은 editorPreviewSections SSOT.
 */
'use client';

import { useEffect, useMemo, useRef } from 'react';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import type { InvitationRuntimeData } from '@/src/invitation/schemas';
import { getMusicByKey } from '@/src/constants/music';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
import {
  resolveEditorPreviewSectionId,
  scrollPreviewToSection,
} from '@/src/editors/shared/editorPreviewSections';
import styles from '../weddingEditor.module.css';

type LivePreviewPanelProps = {
  data: InvitationRuntimeData;
  title?: string;
  fullscreen?: boolean;
  /** Figma: “현재 편집 중: {step}” */
  editingStepLabel?: string;
  /** Editor active step key (setup/message/hero/...) */
  focusSectionId?: string | null;
  /** Increment to re-scroll even when the same step is selected again */
  scrollRequestId?: number;
  conceptType?: 'WEDDING' | 'FUNERAL' | 'GENERAL';
};

/**
 * Figma Desktop LivePreviewPanel — 340px column, phone radius 28.
 */
export default function LivePreviewPanel({
  data,
  title = '실시간 미리보기',
  fullscreen = false,
  editingStepLabel,
  focusSectionId,
  scrollRequestId = 0,
  conceptType = 'WEDDING',
}: LivePreviewPanelProps) {
  const frameClassName = fullscreen
    ? `${styles.previewFrame} ${styles.previewFrameFullscreen}`
    : styles.previewFrame;
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playableMusic = useMemo(
    () =>
      resolvePlayableInvitationMusic(data, (key) => {
        const track = getMusicByKey(key);
        return track ? { src: track.src, title: track.title } : undefined;
      }),
    [data]
  );

  const resolvedFocusId = focusSectionId
    ? resolveEditorPreviewSectionId(focusSectionId, conceptType)
    : null;

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const onScroll = () => {
      userScrollingRef.current = true;
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 800);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!resolvedFocusId || !focusSectionId) return;

    const root = scrollRef.current;
    if (!root) return;

    userScrollingRef.current = false;

    let cancelled = false;
    const timers: number[] = [];

    const scrollToTarget = () => {
      if (cancelled) return;
      return scrollPreviewToSection(root, resolvedFocusId);
    };

    const attempt = (delayMs: number) => {
      timers.push(
        window.setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToTarget();
            });
          });
        }, delayMs)
      );
    };

    // 첫 렌더·이미지/지도 높이 변화·같은 Step 재클릭을 흡수하기 위한 제한된 retry
    attempt(0);
    attempt(120);
    attempt(280);
    attempt(560);

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [resolvedFocusId, focusSectionId, scrollRequestId, conceptType]);

  return (
    <div
      className={styles.previewPanel}
      style={{ width: fullscreen ? undefined : 340 }}
      data-testid="editor-live-preview-panel"
    >
      {!fullscreen && title ? <p className={styles.previewTitle}>{title}</p> : null}
      <div className={frameClassName} style={{ position: 'relative' }}>
        {!fullscreen ? <div className={styles.previewNotch} aria-hidden /> : null}
        <div
          ref={scrollRef}
          className={styles.previewScroll}
          data-testid="editor-live-preview-viewport"
        >
          <FullInvitationRenderer data={data} previewMode />
        </div>
        {playableMusic ? (
          <div className={styles.previewMusicSlot}>
            <InvitationMusicPlayer music={playableMusic} />
          </div>
        ) : null}
      </div>
      {!fullscreen && editingStepLabel ? (
        <div className={styles.editingCard} data-testid="editor-preview-editing-indicator">
          <p>
            현재 편집 중: <strong>{editingStepLabel}</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}

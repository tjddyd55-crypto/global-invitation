'use client';

import { useEffect, useMemo, useRef } from 'react';
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
  /** Editor active step → Preview section auto-focus (data-section-id) */
  focusSectionId?: string | null;
};

const EDITOR_STEP_TO_SECTION: Record<string, string> = {
  rsvp: 'rsvp',
  accounts: 'accounts',
  gallery: 'gallery',
  location: 'location',
  couple: 'couple',
  comments: 'comments',
};

/**
 * Figma Desktop LivePreviewPanel — 340px column, phone radius 28.
 * Preview는 draft state 기반 FullInvitationRenderer + previewMode.
 * 음악은 공개와 동일 조건, 자동재생 없음.
 */
export default function LivePreviewPanel({
  data,
  title = '실시간 미리보기',
  fullscreen = false,
  editingStepLabel,
  focusSectionId,
}: LivePreviewPanelProps) {
  const frameClassName = fullscreen
    ? `${styles.previewFrame} ${styles.previewFrameFullscreen}`
    : styles.previewFrame;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFocusedStepRef = useRef<string | null>(null);
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

  const resolvedFocusId =
    focusSectionId && EDITOR_STEP_TO_SECTION[focusSectionId]
      ? EDITOR_STEP_TO_SECTION[focusSectionId]
      : focusSectionId || null;

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
    if (!resolvedFocusId) return;

    const root = scrollRef.current;
    if (!root) return;
    if (lastFocusedStepRef.current === resolvedFocusId) return;

    // step 전환 시에는 사용자 스크롤 억제를 무시하고 1회 포커스
    userScrollingRef.current = false;

    const timer = window.setTimeout(() => {
      const target = root.querySelector(`[data-section-id="${resolvedFocusId}"]`);
      lastFocusedStepRef.current = resolvedFocusId;
      if (!target || !(target instanceof HTMLElement)) return;

      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop =
        root.scrollTop + (targetRect.top - rootRect.top) - rootRect.height / 2 + targetRect.height / 2;
      root.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    }, 160);

    return () => window.clearTimeout(timer);
  }, [resolvedFocusId, data]);

  return (
    <div className={styles.previewPanel} style={{ width: fullscreen ? undefined : 340 }}>
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
        <div className={styles.editingCard}>
          <p>
            현재 편집 중: <strong>{editingStepLabel}</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}

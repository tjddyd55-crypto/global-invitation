'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatEditorSavedAtLabel } from '@/src/lib/i18n/format';
import styles from './EditorHeader.module.css';

export type EditorLanguageOption = 'ko' | 'en' | 'mn';

type EditorHeaderProps = {
  title: string;
  conceptLabel: string;
  draftStatus?: 'draft' | 'published';
  lastSavedAt?: string | null;
  saveNotice?: string | null;
  saveError?: string | null;
  saving?: boolean;
  publishing?: boolean;
  saveDisabled?: boolean;
  saveLabel?: string;
  onSave?: () => void | Promise<void>;
  onSaveAndExit?: () => void | Promise<void>;
  onPublish?: () => void | Promise<void>;
  onPreview?: () => void;
  language?: EditorLanguageOption;
  onLanguageChange?: (language: EditorLanguageOption) => void;
  shell?: 'mobile' | 'desktop';
};

/**
 * Figma Make DesktopEditor / EditorScreen header.
 * - Desktop: 72px single sticky bar (back · title · badge · save · publish · more)
 * - Mobile: sticky single row (back · title · badge · save · more)
 */
export default function EditorHeader({
  title,
  draftStatus = 'draft',
  lastSavedAt,
  saveNotice,
  saveError,
  saving,
  publishing,
  saveDisabled,
  saveLabel = '저장',
  onSave,
  onSaveAndExit,
  onPublish,
  language,
  onLanguageChange,
  shell = 'desktop',
}: EditorHeaderProps) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();

  const statusLabel = draftStatus === 'published' ? '공개됨' : '초안';
  const statusClassName =
    draftStatus === 'published' ? `${styles.statusBadge} ${styles.statusPublished}` : styles.statusBadge;
  const lastSavedLabel = formatEditorSavedAtLabel(lastSavedAt);

  useEffect(() => {
    if (!moreOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [moreOpen]);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave();
  };

  const handleSaveAndExit = async () => {
    if (!onSaveAndExit) return;
    setMoreOpen(false);
    await onSaveAndExit();
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    setMoreOpen(false);
    await onPublish();
  };

  const moreItems: Array<{ key: string; label: string; onClick: () => void; danger?: boolean }> = [];
  if (shell === 'mobile' && onPublish) {
    moreItems.push({
      key: 'publish',
      label: publishing ? '공개 중...' : '공개하기',
      onClick: () => void handlePublish(),
    });
  }
  if (onSaveAndExit) {
    moreItems.push({
      key: 'exit',
      label: '저장하고 나가기',
      onClick: () => void handleSaveAndExit(),
    });
  }
  if (language && onLanguageChange) {
    moreItems.push({
      key: 'lang-ko',
      label: '언어: 한국어',
      onClick: () => {
        onLanguageChange('ko');
        setMoreOpen(false);
      },
    });
    moreItems.push({
      key: 'lang-en',
      label: '언어: English',
      onClick: () => {
        onLanguageChange('en');
        setMoreOpen(false);
      },
    });
  }

  if (shell === 'mobile') {
    return (
      <header className={styles.mobileHeader} data-testid="editor-header-mobile">
        <button
          type="button"
          className={styles.iconButton}
          aria-label="뒤로"
          onClick={() => router.back()}
        >
          ←
        </button>
        <div className={styles.mobileTitleWrap}>
          <h1 className={styles.mobileTitle}>{title}</h1>
          <span className={statusClassName}>{statusLabel}</span>
        </div>
        <button
          type="button"
          className={styles.mobileSave}
          onClick={() => void handleSave()}
          disabled={saving || !onSave || saveDisabled}
          data-testid="editor-save-button"
          data-saving={saving ? 'true' : 'false'}
        >
          {saving ? '저장 중' : saveLabel}
        </button>
        <div className={styles.menuWrap} ref={moreRef}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="더보기"
            aria-expanded={moreOpen}
            aria-controls={moreMenuId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            ···
          </button>
          {moreOpen && moreItems.length > 0 ? (
            <div id={moreMenuId} className={styles.menuPanel} role="menu">
              {moreItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={styles.menuItem}
                  onClick={item.onClick}
                  role="menuitem"
                  data-testid={item.key === 'publish' ? 'editor-publish-button' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {(saveNotice || saveError || lastSavedLabel) && (
          <p className={styles.mobileMeta}>
            {saveError || saveNotice || lastSavedLabel}
          </p>
        )}
      </header>
    );
  }

  return (
    <header className={styles.desktopHeader} data-testid="editor-header-desktop">
      <button type="button" className={styles.backButton} onClick={() => router.back()}>
        ← 뒤로
      </button>
      <div className={styles.desktopDivider} aria-hidden />
      <div className={styles.desktopTitleGroup}>
        <span className={styles.desktopTitle}>{title}</span>
        <span className={statusClassName}>{statusLabel}</span>
        {lastSavedLabel ? <span className={styles.desktopMeta}>{lastSavedLabel}</span> : null}
      </div>
      <div className={styles.desktopActions}>
        <button
          type="button"
          className={styles.desktopSave}
          onClick={() => void handleSave()}
          disabled={saving || !onSave || saveDisabled}
          data-testid="editor-save-button"
          data-saving={saving ? 'true' : 'false'}
        >
          {saving ? '저장 중...' : saveLabel}
        </button>
        {onPublish ? (
          <button
            type="button"
            className={styles.desktopPublish}
            onClick={() => void handlePublish()}
            disabled={saving || publishing}
            data-testid="editor-publish-button"
          >
            {publishing ? '공개 중...' : '공개하기'}
          </button>
        ) : null}
        <div className={styles.menuWrap} ref={moreRef}>
          <button
            type="button"
            className={styles.desktopMore}
            aria-label="더보기"
            aria-expanded={moreOpen}
            aria-controls={moreMenuId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            ···
          </button>
          {moreOpen && moreItems.length > 0 ? (
            <div id={moreMenuId} className={styles.menuPanel} role="menu">
              {moreItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={styles.menuItem}
                  onClick={item.onClick}
                  role="menuitem"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {saveNotice ? <p className={styles.desktopNotice}>{saveNotice}</p> : null}
      {saveError ? <p className={styles.desktopError}>{saveError}</p> : null}
    </header>
  );
}

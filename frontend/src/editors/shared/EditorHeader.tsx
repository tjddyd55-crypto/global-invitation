'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatEditorSavedAtLabel } from '@/src/lib/i18n/format';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
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
  locale?: ProductLocaleId;
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
  saveLabel,
  onSave,
  onSaveAndExit,
  onPublish,
  language,
  onLanguageChange,
  locale = 'ko-KR',
  shell = 'desktop',
}: EditorHeaderProps) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();
  const t = (key: string) => invitationT(locale, key);

  const statusLabel = draftStatus === 'published' ? t('editor.header.published') : t('editor.header.draft');
  const statusClassName =
    draftStatus === 'published' ? `${styles.statusBadge} ${styles.statusPublished}` : styles.statusBadge;
  const lastSavedLabel = formatEditorSavedAtLabel(lastSavedAt, locale);

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

  const resolvedSaveLabel = saveLabel || t('editor.action.save');
  const moreItems: Array<{ key: string; label: string; onClick: () => void; danger?: boolean }> = [];
  if (shell === 'mobile' && onPublish) {
    moreItems.push({
      key: 'publish',
      label: publishing ? t('editor.action.publishing') : t('editor.action.publish'),
      onClick: () => void handlePublish(),
    });
  }
  if (onSaveAndExit) {
    moreItems.push({
      key: 'exit',
      label: t('editor.action.saveAndExit'),
      onClick: () => void handleSaveAndExit(),
    });
  }
  void language;
  void onLanguageChange;

  if (shell === 'mobile') {
    return (
      <header className={styles.mobileHeader} data-testid="editor-header-mobile">
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('editor.nav.back')}
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
          {saving ? t('editor.nav.saving') : resolvedSaveLabel}
        </button>
        <div className={styles.menuWrap} ref={moreRef}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('editor.nav.more')}
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
        ← {t('editor.nav.back')}
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
          {saving ? `${t('editor.nav.saving')}...` : resolvedSaveLabel}
        </button>
        {onPublish ? (
          <button
            type="button"
            className={styles.desktopPublish}
            onClick={() => void handlePublish()}
            disabled={saving || publishing}
            data-testid="editor-publish-button"
          >
            {publishing ? t('editor.action.publishing') : t('editor.action.publish')}
          </button>
        ) : null}
        <div className={styles.menuWrap} ref={moreRef}>
          <button
            type="button"
            className={styles.desktopMore}
            aria-label={t('editor.nav.more')}
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

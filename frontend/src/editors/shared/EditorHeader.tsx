'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function EditorHeader({
  title,
  conceptLabel,
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
  onPreview,
  language,
  onLanguageChange,
  shell = 'desktop',
}: EditorHeaderProps) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();
  const settingsMenuId = useId();

  const statusLabel = draftStatus === 'published' ? '공개됨' : '초안';
  const statusClassName =
    draftStatus === 'published' ? `${styles.statusBadge} ${styles.statusPublished}` : styles.statusBadge;
  const lastSavedLabel = lastSavedAt
    ? `최근 저장: ${new Date(lastSavedAt).toLocaleString()}`
    : '저장되지 않은 변경사항';

  useEffect(() => {
    if (!moreOpen && !settingsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreOpen && moreRef.current && !moreRef.current.contains(target)) {
        setMoreOpen(false);
      }
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [moreOpen, settingsOpen]);

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

  const showLanguageSettings = Boolean(language && onLanguageChange);
  const showMoreMenu = Boolean(onSaveAndExit || onPublish);

  if (shell === 'mobile') {
    return (
      <header className={`${styles.editorHeader} ${styles.editorHeaderMobile}`} data-testid="editor-header-mobile">
        <div className={styles.mobileTopRow}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="뒤로"
            onClick={() => router.back()}
          >
            ←
          </button>
          <h1 className={styles.editorTitleMobile}>{title}</h1>
          <div className={styles.menuWrap} ref={moreRef}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="더보기"
              aria-expanded={moreOpen}
              aria-controls={moreMenuId}
              onClick={() => {
                setMoreOpen((open) => !open);
                setSettingsOpen(false);
              }}
            >
              ···
            </button>
            {moreOpen && showMoreMenu ? (
              <div id={moreMenuId} className={styles.menuPanel} role="menu">
                {onSaveAndExit && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleSaveAndExit}
                    disabled={saving}
                    role="menuitem"
                  >
                    저장하고 나가기
                  </button>
                )}
                {onPublish && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handlePublish}
                    disabled={saving || publishing}
                    data-testid="editor-publish-button"
                    role="menuitem"
                  >
                    {publishing ? '공개 중...' : '공개하기'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.mobileStatusRow}>
          <span className={statusClassName}>{statusLabel}</span>
          <span className={styles.statusMeta}>{lastSavedLabel}</span>
        </div>

        <div className={styles.mobileActionRow}>
          {showLanguageSettings ? (
            <div className={styles.menuWrap} ref={settingsRef}>
              <button
                type="button"
                className={styles.buttonGhostCompact}
                aria-expanded={settingsOpen}
                aria-controls={settingsMenuId}
                onClick={() => {
                  setSettingsOpen((open) => !open);
                  setMoreOpen(false);
                }}
              >
                설정
              </button>
              {settingsOpen ? (
                <div id={settingsMenuId} className={styles.menuPanel} role="menu">
                  <label className={styles.languageField}>
                    <span>언어</span>
                    <select
                      value={language}
                      onChange={(event) =>
                        onLanguageChange?.(event.target.value as EditorLanguageOption)
                      }
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="mn">Монгол</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            className={`${styles.buttonPrimaryCompact} ${styles.saveButton}`}
            onClick={handleSave}
            disabled={saving || !onSave || saveDisabled}
            data-testid="editor-save-button"
            data-saving={saving ? 'true' : 'false'}
          >
            {saving ? '저장 중...' : saveLabel}
          </button>
          {onPreview ? (
            <button type="button" className={styles.buttonGhostCompact} onClick={onPreview}>
              미리보기
            </button>
          ) : null}
        </div>

        {saveNotice && <p className={styles.noticeText}>{saveNotice}</p>}
        {saveError && <p className={styles.errorText}>{saveError}</p>}
      </header>
    );
  }

  return (
    <header className={styles.editorHeader} data-testid="editor-header-desktop">
      <div className={styles.headerMain}>
        <h1 className={styles.editorTitle}>{title}</h1>
        <p className={styles.editorSubtitle}>입력 즉시 미리보기에 반영됩니다.</p>
        <div className={styles.statusLine}>
          <span className={statusClassName}>{statusLabel}</span>
          <span className={styles.conceptBadge}>{conceptLabel}</span>
          <span className={styles.statusMeta}>{lastSavedLabel}</span>
        </div>
        {saveNotice && <p className={styles.noticeText}>{saveNotice}</p>}
        {saveError && <p className={styles.errorText}>{saveError}</p>}
      </div>

      <div className={styles.headerActions}>
        {showLanguageSettings && (
          <div className={styles.menuWrap} ref={settingsRef}>
            <button
              type="button"
              className={styles.buttonGhost}
              aria-expanded={settingsOpen}
              aria-controls={settingsMenuId}
              onClick={() => {
                setSettingsOpen((open) => !open);
                setMoreOpen(false);
              }}
            >
              설정
            </button>
            {settingsOpen && (
              <div id={settingsMenuId} className={styles.menuPanel} role="menu">
                <label className={styles.languageField}>
                  <span>언어</span>
                  <select
                    value={language}
                    onChange={(event) =>
                      onLanguageChange?.(event.target.value as EditorLanguageOption)
                    }
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="mn">Монгол</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className={`${styles.buttonPrimary} ${styles.saveButton}`}
          onClick={handleSave}
          disabled={saving || !onSave || saveDisabled}
          data-testid="editor-save-button"
          data-saving={saving ? 'true' : 'false'}
        >
          {saving ? '저장 중...' : saveLabel}
        </button>

        {(onSaveAndExit || onPublish) && (
          <div className={styles.desktopExtraActions}>
            {onSaveAndExit && (
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={handleSaveAndExit}
                disabled={saving}
              >
                저장하고 나가기
              </button>
            )}
            {onPublish && (
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handlePublish}
                disabled={saving || publishing}
                data-testid="editor-publish-button"
              >
                {publishing ? '공개 중...' : '공개하기'}
              </button>
            )}
          </div>
        )}

        {showMoreMenu && (
          <div className={`${styles.menuWrap} ${styles.mobileMoreWrap}`} ref={moreRef}>
            <button
              type="button"
              className={styles.buttonGhost}
              aria-expanded={moreOpen}
              aria-controls={moreMenuId}
              onClick={() => {
                setMoreOpen((open) => !open);
                setSettingsOpen(false);
              }}
            >
              더보기
            </button>
            {moreOpen && (
              <div id={moreMenuId} className={styles.menuPanel} role="menu">
                {onSaveAndExit && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleSaveAndExit}
                    disabled={saving}
                    role="menuitem"
                  >
                    저장하고 나가기
                  </button>
                )}
                {onPublish && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handlePublish}
                    disabled={saving || publishing}
                    data-testid="editor-publish-button"
                    role="menuitem"
                  >
                    {publishing ? '공개 중...' : '공개하기'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

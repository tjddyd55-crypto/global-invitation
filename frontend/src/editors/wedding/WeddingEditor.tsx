'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './weddingEditor.module.css';
import LivePreviewPanel from './components/LivePreviewPanel';
import Step0Setup from './steps/Step0Setup';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2HeroImage from './steps/Step2HeroImage';
import Step3InvitationMessage from './steps/Step3InvitationMessage';
import Step4CoupleInfo from './steps/Step4CoupleInfo';
import Step5Gallery from './steps/Step5Gallery';
import Step6Location from './steps/Step6Location';
import Step7Accounts from './steps/Step7Accounts';
import Step8Extras from './steps/Step8Extras';
import Step9SharePreview from './steps/Step9SharePreview';
import { buildSharePreview, buildWeddingClassicPreviewData } from './state/weddingEditor.mapper';
import { weddingEditorReducer } from './state/weddingEditor.reducer';
import type { WeddingEditorState } from './state/weddingEditor.types';
import { logEvent } from '@/src/lib/events';

type EditorSectionKey =
  | 'basic'
  | 'hero'
  | 'couple'
  | 'gallery'
  | 'location'
  | 'accounts'
  | 'rsvp'
  | 'share';

type EditorSectionItem = {
  key: EditorSectionKey;
  title: string;
};

const EDITOR_SECTIONS: EditorSectionItem[] = [
  { key: 'basic', title: 'Basic Info' },
  { key: 'hero', title: 'Hero' },
  { key: 'couple', title: 'Couple' },
  { key: 'gallery', title: 'Gallery' },
  { key: 'location', title: 'Location' },
  { key: 'accounts', title: 'Accounts' },
  { key: 'rsvp', title: 'RSVP' },
  { key: 'share', title: 'Share' },
];

type WeddingEditorProps = {
  initialState: WeddingEditorState;
  pageUrl: string;
  onSave?: (state: WeddingEditorState) => Promise<void> | void;
  onSaveAndExit?: (state: WeddingEditorState) => Promise<void> | void;
  onPublish?: (state: WeddingEditorState) => Promise<void> | void;
  saving?: boolean;
  publishing?: boolean;
  isDemo?: boolean;
  saveError?: string | null;
  saveNotice?: string | null;
  draftStatus?: 'draft' | 'published';
  lastSavedAt?: string | null;
};

export default function WeddingEditor({
  initialState,
  pageUrl,
  onSave,
  onSaveAndExit,
  onPublish,
  saving,
  publishing,
  isDemo,
  saveError,
  saveNotice,
  draftStatus = 'draft',
  lastSavedAt,
}: WeddingEditorProps) {
  const [state, dispatch] = useReducer(weddingEditorReducer, initialState);
  const [activeSection, setActiveSection] = useState<EditorSectionKey>('basic');
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);
  const previewLoggedRef = useRef(false);
  const formScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<EditorSectionKey, HTMLElement | null>>({
    basic: null,
    hero: null,
    couple: null,
    gallery: null,
    location: null,
    accounts: null,
    rsvp: null,
    share: null,
  });

  const previewData = useMemo(() => buildWeddingClassicPreviewData(state), [state]);
  const sharePreview = useMemo(() => buildSharePreview(state), [state]);

  useEffect(() => {
    if (previewLoggedRef.current || !fullscreenPreviewOpen) return;
    if (isDemo) return;
    logEvent({ eventType: 'preview_open', templateType: 'wedding', language: state.setup.language, pageUrl });
    previewLoggedRef.current = true;
  }, [fullscreenPreviewOpen, isDemo, pageUrl, state.setup.language]);

  useEffect(() => {
    if (!fullscreenPreviewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreenPreviewOpen]);

  useEffect(() => {
    const root = formScrollContainerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length === 0) return;
        const key = visibleEntries[0].target.getAttribute('data-section-key') as EditorSectionKey | null;
        if (!key) return;
        setActiveSection(key);
      },
      {
        root,
        threshold: [0.2, 0.35, 0.5, 0.75],
        rootMargin: '-20% 0px -55% 0px',
      }
    );

    EDITOR_SECTIONS.forEach((section) => {
      const node = sectionRefs.current[section.key];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(state);
  };

  const handleSaveAndExit = async () => {
    if (!onSaveAndExit) return;
    await onSaveAndExit(state);
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    await onPublish(state);
  };

  const statusLabel = draftStatus === 'published' ? '공개됨' : '초안';
  const statusClassName =
    draftStatus === 'published' ? `${styles.statusBadge} ${styles.statusPublished}` : styles.statusBadge;
  const lastSavedLabel = lastSavedAt
    ? `최근 저장: ${new Date(lastSavedAt).toLocaleString()}`
    : '저장되지 않은 변경사항';

  const handleScrollToSection = (key: EditorSectionKey) => {
    const node = sectionRefs.current[key];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(key);
  };

  const setSectionRef = (key: EditorSectionKey) => (node: HTMLElement | null) => {
    sectionRefs.current[key] = node;
  };

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div>
          <h1 className={styles.editorTitle}>결혼식 에디터</h1>
          <p className={styles.editorSubtitle}>입력 즉시 미리보기에 반영됩니다.</p>
          <div className={styles.statusLine}>
            <span className={statusClassName}>{statusLabel}</span>
            <span className={styles.statusMeta}>{lastSavedLabel}</span>
          </div>
          {saveNotice && <p className={styles.noticeText}>{saveNotice}</p>}
          {saveError && <p className={styles.errorText}>{saveError}</p>}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={handleSave}
            disabled={saving || !onSave}
          >
            {saving ? '저장 중...' : isDemo ? '저장(데모)' : '저장'}
          </button>
          {onSaveAndExit && (
            <button type="button" className={styles.buttonGhost} onClick={handleSaveAndExit} disabled={saving}>
              저장/나가기
            </button>
          )}
          {onPublish && (
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handlePublish}
              disabled={saving || publishing}
            >
              {publishing ? '공개 중...' : '공개하기'}
            </button>
          )}
        </div>
      </header>

      <div className={styles.editorLayout}>
        <aside className={styles.navColumn}>
          <nav className={styles.sectionNav}>
            {EDITOR_SECTIONS.map((section) => {
              const isActive = section.key === activeSection;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${styles.sectionNavItem} ${isActive ? styles.sectionNavItemActive : ''}`}
                  onClick={() => handleScrollToSection(section.key)}
                >
                  {section.title}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className={styles.formColumn} ref={formScrollContainerRef}>
          <div className={styles.mobileSectionNav}>
            {EDITOR_SECTIONS.map((section) => {
              const isActive = section.key === activeSection;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${styles.mobileSectionNavItem} ${isActive ? styles.mobileSectionNavItemActive : ''}`}
                  onClick={() => handleScrollToSection(section.key)}
                >
                  {section.title}
                </button>
              );
            })}
          </div>

          <div className={styles.sectionStack}>
            <section
              className={styles.editorSection}
              data-section-key="basic"
              ref={setSectionRef('basic')}
            >
              <Step0Setup value={state.setup} onChange={(payload) => dispatch({ type: 'SET_SETUP', payload })} />
              <Step1BasicInfo value={state.basic} onChange={(payload) => dispatch({ type: 'SET_BASIC', payload })} />
              <Step3InvitationMessage
                value={state.invitationMessage}
                onChange={(payload) => dispatch({ type: 'SET_INVITATION_MESSAGE', payload })}
              />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="hero"
              ref={setSectionRef('hero')}
            >
              <Step2HeroImage value={state.hero} onChange={(payload) => dispatch({ type: 'SET_HERO', payload })} />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="couple"
              ref={setSectionRef('couple')}
            >
              <Step4CoupleInfo
                groom={state.groom}
                bride={state.bride}
                onGroomChange={(payload) => dispatch({ type: 'SET_GROOM', payload })}
                onBrideChange={(payload) => dispatch({ type: 'SET_BRIDE', payload })}
              />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="gallery"
              ref={setSectionRef('gallery')}
            >
              <Step5Gallery
                value={state.gallery}
                onChange={(images) => dispatch({ type: 'SET_GALLERY_IMAGES', payload: images })}
              />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="location"
              ref={setSectionRef('location')}
            >
              <Step6Location
                value={state.location}
                onChange={(payload) => dispatch({ type: 'SET_LOCATION', payload })}
              />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="accounts"
              ref={setSectionRef('accounts')}
            >
              <Step7Accounts
                accounts={state.accounts}
                onChange={(accounts) => dispatch({ type: 'SET_ACCOUNTS', payload: accounts })}
              />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="rsvp"
              ref={setSectionRef('rsvp')}
            >
              <Step8Extras value={state.extras} onChange={(payload) => dispatch({ type: 'SET_EXTRAS', payload })} />
            </section>

            <section
              className={styles.editorSection}
              data-section-key="share"
              ref={setSectionRef('share')}
            >
              <Step9SharePreview
                data={previewData}
                share={state.share}
                previewShare={sharePreview}
                heroImage={state.hero.heroImage}
                showRsvp={state.extras.rsvpEnabled}
                showGuestbook={state.extras.guestbookEnabled}
                onShareChange={(payload) => dispatch({ type: 'SET_SHARE', payload })}
              />
            </section>
          </div>
        </main>
      </div>

      <button
        type="button"
        className={styles.previewFloatingButton}
        onClick={() => setFullscreenPreviewOpen(true)}
      >
        Preview
      </button>

      {fullscreenPreviewOpen && (
        <div className={styles.fullscreenPreviewOverlay}>
          <div className={styles.fullscreenPreviewHeader}>
            <strong>라이브 미리보기</strong>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setFullscreenPreviewOpen(false)}
            >
              닫기
            </button>
          </div>
          <div className={styles.fullscreenPreviewBody}>
            <LivePreviewPanel
              data={previewData}
              showRsvp={state.extras.rsvpEnabled}
              showGuestbook={state.extras.guestbookEnabled}
              fullscreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

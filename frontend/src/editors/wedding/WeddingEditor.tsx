'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './weddingEditor.module.css';
import LivePreviewPanel from './components/LivePreviewPanel';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2HeroImage from './steps/Step2HeroImage';
import Step3InvitationMessage from './steps/Step3InvitationMessage';
import Step3ScheduleInfo from './steps/Step3ScheduleInfo';
import Step4CoupleInfo from './steps/Step4CoupleInfo';
import Step5Gallery from './steps/Step5Gallery';
import Step6Location from './steps/Step6Location';
import Step7Accounts from './steps/Step7Accounts';
import Step8Extras from './steps/Step8Extras';
import Step9ShareSettings from './steps/Step9ShareSettings';
import { buildWeddingClassicPreviewData } from './state/weddingEditor.mapper';
import { weddingEditorReducer } from './state/weddingEditor.reducer';
import type { WeddingEditorState } from './state/weddingEditor.types';
import { resolveVisibleSections } from './state/editorSteps';
import { computeEditorCompleteness } from './state/editorCompleteness';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';
import { logEvent } from '@/src/lib/events';
import EditorHeader from '@/src/editors/shared/EditorHeader';
import UnifiedStepperNav from '@/src/editors/shared/UnifiedStepperNav';
import { useEditorShell } from '@/src/editors/shared/useEditorShell';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);
  const [hasBlockingUploadState, setHasBlockingUploadState] = useState(false);
  const previewLoggedRef = useRef(false);
  const shell = useEditorShell();

  const previewData = useMemo(() => buildWeddingClassicPreviewData(state), [state]);
  const visibleSections = useMemo(() => resolveVisibleSections(state.setup.conceptType), [state.setup.conceptType]);
  const completeness = useMemo(() => computeEditorCompleteness(state), [state]);
  const activeSection = visibleSections[currentStep]?.key ?? visibleSections[0]?.key ?? 'setup';
  const conceptPresentation = getConceptPresentationConfig(state.setup.conceptType);

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
    if (currentStep >= visibleSections.length) {
      setCurrentStep(0);
    }
  }, [currentStep, visibleSections.length]);

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

  const handleSetupChange = (payload: Partial<WeddingEditorState['setup']>) => {
    if (Object.keys(payload).length === 0) return;
    dispatch({ type: 'SET_SETUP', payload });
  };

  const handleGalleryUploadStateChange = (uploadState: { isUploading: boolean; hasError: boolean }) => {
    setHasBlockingUploadState(uploadState.isUploading || uploadState.hasError);
  };

  const handleGalleryImagesChange = (images: WeddingEditorState['gallery']['images']) => {
    dispatch({ type: 'SET_GALLERY_IMAGES', payload: images });
  };

  const handleGalleryPersist = async (images: WeddingEditorState['gallery']['images']) => {
    if (!onSave) return;
    await onSave({
      ...state,
      gallery: { images },
    });
  };

  const conceptLabel =
    state.setup.conceptType === 'WEDDING'
      ? '결혼식 초대장'
      : state.setup.conceptType === 'FUNERAL'
        ? '부고장'
        : '일반 행사';

  const renderStep = () => {
    switch (activeSection) {
      case 'setup':
        return (
          <Step1BasicInfo
            value={state.basic}
            conceptType={state.setup.conceptType}
            onChange={(payload) => dispatch({ type: 'SET_BASIC', payload })}
          />
        );
      case 'message':
        return (
          <Step3InvitationMessage
            value={state.invitationMessage}
            conceptType={state.setup.conceptType}
            onChange={(payload) => dispatch({ type: 'SET_INVITATION_MESSAGE', payload })}
          />
        );
      case 'hero':
        return <Step2HeroImage value={state.hero} onChange={(payload) => dispatch({ type: 'SET_HERO', payload })} />;
      case 'couple':
        return (
          <Step4CoupleInfo
            groom={state.groom}
            bride={state.bride}
            onGroomChange={(payload) => dispatch({ type: 'SET_GROOM', payload })}
            onBrideChange={(payload) => dispatch({ type: 'SET_BRIDE', payload })}
          />
        );
      case 'schedule':
        return <Step3ScheduleInfo value={state.basic} onChange={(payload) => dispatch({ type: 'SET_BASIC', payload })} />;
      case 'gallery':
        return (
          <Step5Gallery
            value={state.gallery}
            onChange={handleGalleryImagesChange}
            onPersist={onSave ? handleGalleryPersist : undefined}
            onUploadStateChange={handleGalleryUploadStateChange}
          />
        );
      case 'location':
        return (
          <Step6Location
            value={state.location}
            venueName={state.basic.venueName}
            venueDetail={state.basic.venueDetail}
            onChange={(payload) => dispatch({ type: 'SET_LOCATION', payload })}
            onVenueChange={(payload) => dispatch({ type: 'SET_BASIC', payload })}
          />
        );
      case 'accounts':
        return (
          <Step7Accounts
            accounts={state.accounts}
            onChange={(accounts) => dispatch({ type: 'SET_ACCOUNTS', payload: accounts })}
            conceptType={state.setup.conceptType}
            accountEnabled={Boolean(
              typeof state.extras.accountEnabled === 'boolean'
                ? state.extras.accountEnabled
                : conceptPresentation.accountDefaultEnabled
            )}
            accountsTitle={state.extras.accountsTitle ?? conceptPresentation.accountsTitle}
            onAccountEnabledChange={(enabled) =>
              dispatch({ type: 'SET_EXTRAS', payload: { accountEnabled: enabled } })
            }
            onAccountsTitleChange={(title) =>
              dispatch({ type: 'SET_EXTRAS', payload: { accountsTitle: title } })
            }
          />
        );
      case 'rsvp':
        return <Step8Extras value={state.extras} onChange={(payload) => dispatch({ type: 'SET_EXTRAS', payload })} />;
      case 'share':
        return (
          <Step9ShareSettings
            value={state.share}
            onChange={(payload) => dispatch({ type: 'SET_SHARE', payload })}
            heroImage={state.hero.heroImage}
          />
        );
      default:
        return null;
    }
  };

  if (shell === null) {
    return (
      <div
        className={styles.editorPage}
        data-testid="wedding-editor-root"
        data-editor-shell="pending"
      >
        <div
          data-testid="viewport-shell-fallback"
          style={{
            minHeight: '40vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: 14,
          }}
        >
          에디터 준비 중…
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.editorPage} ${shell === 'mobile' ? styles.editorPageMobile : ''}`}
      data-testid="wedding-editor-root"
      data-editor-shell={shell}
    >
      <EditorHeader
        title={`${conceptLabel} 에디터`}
        conceptLabel={conceptLabel}
        draftStatus={draftStatus}
        lastSavedAt={lastSavedAt}
        saveNotice={saveNotice}
        saveError={saveError}
        saving={saving}
        publishing={publishing}
        saveDisabled={hasBlockingUploadState}
        saveLabel={isDemo ? '저장(데모)' : '저장'}
        onSave={onSave ? handleSave : undefined}
        onSaveAndExit={onSaveAndExit ? handleSaveAndExit : undefined}
        onPublish={onPublish ? handlePublish : undefined}
        onPreview={shell === 'mobile' ? () => setFullscreenPreviewOpen(true) : undefined}
        language={state.setup.language}
        onLanguageChange={(nextLanguage) => handleSetupChange({ language: nextLanguage })}
        shell={shell}
      />

      {shell === 'mobile' ? (
        <div className={styles.mobileEditorLayout} data-testid="mobile-editor-layout">
          <div className={styles.mobileStepper} data-testid="mobile-editor-stepper">
            <UnifiedStepperNav
              steps={visibleSections}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
              orientation="horizontal"
            />
          </div>
          <main className={styles.mobileFormColumn} data-testid="mobile-editor-form">
            <div className={styles.formCard}>
              <h2 className={styles.formCardTitle}>
                {visibleSections[currentStep]?.title ?? '편집'}
              </h2>
              <div className={styles.sectionStack}>{renderStep()}</div>
            </div>
          </main>
          <div className={styles.mobileEditorActions} data-testid="mobile-editor-actions">
            <button
              type="button"
              className={styles.mobileActionGhost}
              onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
              disabled={currentStep <= 0}
            >
              이전
            </button>
            <button
              type="button"
              className={styles.mobileActionPreview}
              onClick={() => setFullscreenPreviewOpen(true)}
            >
              미리보기
            </button>
            <button
              type="button"
              className={styles.mobileActionPrimary}
              onClick={() => {
                if (currentStep >= visibleSections.length - 1) {
                  void handlePublish();
                  return;
                }
                setCurrentStep((step) => Math.min(visibleSections.length - 1, step + 1));
              }}
            >
              {currentStep >= visibleSections.length - 1 ? '공개하기' : '다음'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.editorLayout} data-testid="desktop-editor-layout">
          <aside className={styles.navColumn} data-testid="desktop-editor-sidebar">
            <p className={styles.navColumnLabel}>편집 단계</p>
            <UnifiedStepperNav
              steps={visibleSections}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
              orientation="vertical"
            />
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <span>완성도</span>
                <strong>{completeness.percent}%</strong>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${completeness.percent}%`,
                  }}
                />
              </div>
            </div>
          </aside>

          <main className={styles.formColumn} data-testid="desktop-editor-form">
            <div className={styles.formCard}>
              <h2 className={styles.formCardTitle}>
                {visibleSections[currentStep]?.title ?? '편집'}
              </h2>
              <div className={styles.sectionStack}>{renderStep()}</div>
            </div>
            <div className={styles.desktopStepNav}>
              <button
                type="button"
                className={styles.desktopPrevBtn}
                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                disabled={currentStep <= 0}
              >
                ← 이전
              </button>
              <button
                type="button"
                className={styles.desktopNextBtn}
                onClick={() => {
                  if (currentStep >= visibleSections.length - 1) {
                    void handlePublish();
                    return;
                  }
                  setCurrentStep((step) => Math.min(visibleSections.length - 1, step + 1));
                }}
              >
                {currentStep >= visibleSections.length - 1
                  ? '완료하고 공개하기'
                  : '다음 단계로 →'}
              </button>
            </div>
          </main>

          <aside className={styles.previewColumn} data-testid="desktop-editor-preview">
            <LivePreviewPanel
              title="실시간 미리보기"
              data={previewData}
              editingStepLabel={visibleSections[currentStep]?.title}
              focusSectionId={activeSection}
            />
          </aside>
        </div>
      )}

      {fullscreenPreviewOpen && (
        <div className={styles.fullscreenPreviewOverlay} data-testid="mobile-preview-overlay">
          <div className={styles.previewModal}>
            <div className={styles.fullscreenPreviewHeader}>
              <strong>미리보기</strong>
              <button
                type="button"
                className={styles.previewBackButton}
                onClick={() => setFullscreenPreviewOpen(false)}
                aria-label="미리보기 닫기"
              >
                ✕
              </button>
            </div>
            <div className={styles.fullscreenPreviewBody}>
              <LivePreviewPanel data={previewData} fullscreen focusSectionId={activeSection} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

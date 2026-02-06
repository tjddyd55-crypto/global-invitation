'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './weddingEditor.module.css';
import StepperNav, { type StepItem } from './components/StepperNav';
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

const STEP_ITEMS: StepItem[] = [
  { id: 0, title: '기본 설정' },
  { id: 1, title: '대표 정보' },
  { id: 2, title: '대표 이미지' },
  { id: 3, title: '초대 문구' },
  { id: 4, title: '신랑/신부' },
  { id: 5, title: '갤러리' },
  { id: 6, title: '위치' },
  { id: 7, title: '계좌' },
  { id: 8, title: '부가 기능' },
  { id: 9, title: '공유 미리보기' },
];

type WeddingEditorProps = {
  initialState: WeddingEditorState;
  pageUrl: string;
  onSave?: (state: WeddingEditorState) => Promise<void> | void;
  onSaveAndExit?: (state: WeddingEditorState) => Promise<void> | void;
  saving?: boolean;
  isDemo?: boolean;
  saveError?: string | null;
};

export default function WeddingEditor({
  initialState,
  pageUrl,
  onSave,
  onSaveAndExit,
  saving,
  isDemo,
  saveError,
}: WeddingEditorProps) {
  const [state, dispatch] = useReducer(weddingEditorReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const previewLoggedRef = useRef(false);

  const previewData = useMemo(() => buildWeddingClassicPreviewData(state), [state]);
  const sharePreview = useMemo(() => buildSharePreview(state), [state]);

  const canGoPrev = currentStep > 0;
  const canGoNext = currentStep < STEP_ITEMS.length - 1;

  useEffect(() => {
    if (previewLoggedRef.current) return;
    if (currentStep === 9 || mobilePreviewOpen) {
      logEvent({ eventType: 'preview_open', templateType: 'wedding', language: state.setup.language, pageUrl });
      previewLoggedRef.current = true;
    }
  }, [currentStep, mobilePreviewOpen, pageUrl, state.setup.language]);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(state);
  };

  const handleSaveAndExit = async () => {
    if (!onSaveAndExit) return;
    await onSaveAndExit(state);
  };

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div>
          <h1 className={styles.editorTitle}>결혼식 에디터</h1>
          <p className={styles.editorSubtitle}>입력 즉시 미리보기에 반영됩니다.</p>
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
          <button
            type="button"
            className={`${styles.buttonGhost} ${styles.mobileOnly}`}
            onClick={() => setMobilePreviewOpen(true)}
          >
            미리보기
          </button>
        </div>
      </header>

      <div className={styles.editorLayout}>
        <aside className={styles.navColumn}>
          <StepperNav steps={STEP_ITEMS} currentStep={currentStep} onStepSelect={setCurrentStep} />
        </aside>

        <main className={styles.formColumn}>
          <div className={styles.mobileStepper}>
            <StepperNav
              steps={STEP_ITEMS}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
              variant="horizontal"
            />
          </div>

          {currentStep === 0 && (
            <Step0Setup value={state.setup} onChange={(payload) => dispatch({ type: 'SET_SETUP', payload })} />
          )}
          {currentStep === 1 && (
            <Step1BasicInfo value={state.basic} onChange={(payload) => dispatch({ type: 'SET_BASIC', payload })} />
          )}
          {currentStep === 2 && (
            <Step2HeroImage value={state.hero} onChange={(payload) => dispatch({ type: 'SET_HERO', payload })} />
          )}
          {currentStep === 3 && (
            <Step3InvitationMessage
              value={state.invitationMessage}
              onChange={(payload) => dispatch({ type: 'SET_INVITATION_MESSAGE', payload })}
            />
          )}
          {currentStep === 4 && (
            <Step4CoupleInfo
              groom={state.groom}
              bride={state.bride}
              onGroomChange={(payload) => dispatch({ type: 'SET_GROOM', payload })}
              onBrideChange={(payload) => dispatch({ type: 'SET_BRIDE', payload })}
            />
          )}
          {currentStep === 5 && (
            <Step5Gallery
              value={state.gallery}
              onChange={(images) => dispatch({ type: 'SET_GALLERY_IMAGES', payload: images })}
            />
          )}
          {currentStep === 6 && (
            <Step6Location
              value={state.location}
              onChange={(payload) => dispatch({ type: 'SET_LOCATION', payload })}
            />
          )}
          {currentStep === 7 && (
            <Step7Accounts
              accounts={state.accounts}
              onChange={(accounts) => dispatch({ type: 'SET_ACCOUNTS', payload: accounts })}
            />
          )}
          {currentStep === 8 && (
            <Step8Extras value={state.extras} onChange={(payload) => dispatch({ type: 'SET_EXTRAS', payload })} />
          )}
          {currentStep === 9 && (
            <Step9SharePreview
              data={previewData}
              share={state.share}
              previewShare={sharePreview}
              heroImage={state.hero.heroImage}
              showRsvp={state.extras.rsvpEnabled}
              showGuestbook={state.extras.guestbookEnabled}
              onShareChange={(payload) => dispatch({ type: 'SET_SHARE', payload })}
            />
          )}

          <div className={styles.mobileNav}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
              disabled={!canGoPrev}
            >
              이전
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => setCurrentStep((step) => Math.min(STEP_ITEMS.length - 1, step + 1))}
              disabled={!canGoNext}
            >
              다음
            </button>
          </div>
        </main>

        <aside className={styles.previewColumn}>
          <LivePreviewPanel
            data={previewData}
            showRsvp={state.extras.rsvpEnabled}
            showGuestbook={state.extras.guestbookEnabled}
            title="라이브 미리보기"
          />
        </aside>
      </div>

      {mobilePreviewOpen && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewOverlayHeader}>
            <span>미리보기</span>
            <button type="button" className={styles.buttonGhost} onClick={() => setMobilePreviewOpen(false)}>
              닫기
            </button>
          </div>
          <div className={styles.previewOverlayBody}>
            <LivePreviewPanel
              data={previewData}
              showRsvp={state.extras.rsvpEnabled}
              showGuestbook={state.extras.guestbookEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

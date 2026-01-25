'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './messageCardEditor.module.css';
import StepperNav, { type MessageCardStep } from './components/StepperNav';
import PreviewPanel from './components/PreviewPanel';
import Step1Cover from './steps/Step1Cover';
import Step2Content from './steps/Step2Content';
import Step3Actions from './steps/Step3Actions';
import Step4SharePreview from './steps/Step4SharePreview';
import { messageCardEditorReducer } from './state/messageCardEditor.reducer';
import type { MessageCardEditorState } from './state/messageCardEditor.types';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';

const STEP_ITEMS: MessageCardStep[] = [
  { id: 1, title: '커버 이미지' },
  { id: 2, title: '메시지 내용' },
  { id: 3, title: '액션 버튼' },
  { id: 4, title: '공유 미리보기' },
];

type MessageCardEditorProps = {
  initialState: MessageCardEditorState;
  pageUrl: string;
  onSave?: (state: MessageCardEditorState) => Promise<void> | void;
  saving?: boolean;
  saveError?: string | null;
  saveNotice?: string | null;
};

export default function MessageCardEditor({
  initialState,
  pageUrl,
  onSave,
  saving,
  saveError,
  saveNotice,
}: MessageCardEditorProps) {
  const [state, dispatch] = useReducer(messageCardEditorReducer, initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const previewLoggedRef = useRef(false);
  const { language } = useI18n();

  const ogTitle = useMemo(() => state.title, [state.title]);
  const ogDescription = useMemo(() => state.subtitle || state.description || '', [
    state.subtitle,
    state.description,
  ]);
  const ogImage = useMemo(() => state.coverImage, [state.coverImage]);

  const canGoPrev = currentStep > 1;
  const canGoNext = currentStep < STEP_ITEMS.length;

  useEffect(() => {
    if (previewLoggedRef.current) return;
    if (currentStep === 4 || mobilePreviewOpen) {
      logEvent({ eventType: 'preview_open', templateType: 'message', language, pageUrl });
      previewLoggedRef.current = true;
    }
  }, [currentStep, mobilePreviewOpen, language, pageUrl]);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(state);
  };

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div>
          <h1 className={styles.editorTitle}>MessageCard 에디터</h1>
          <p className={styles.editorSubtitle}>입력 즉시 카드 미리보기에 반영됩니다.</p>
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
            {saving ? '저장 중...' : '저장'}
          </button>
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

          {currentStep === 1 && (
            <Step1Cover
              coverImage={state.coverImage}
              onChange={(coverImage) => dispatch({ type: 'SET_FIELDS', payload: { coverImage } })}
            />
          )}
          {currentStep === 2 && (
            <Step2Content
              title={state.title}
              subtitle={state.subtitle}
              description={state.description}
              eventDate={state.eventDate}
              location={state.location}
              onChange={(payload) => dispatch({ type: 'SET_FIELDS', payload })}
            />
          )}
          {currentStep === 3 && (
            <Step3Actions
              actions={state.actions}
              theme={state.theme}
              onActionsChange={(payload) => dispatch({ type: 'SET_ACTIONS', payload })}
              onThemeChange={(theme) => dispatch({ type: 'SET_THEME', payload: theme })}
            />
          )}
          {currentStep === 4 && (
            <Step4SharePreview data={state} ogTitle={ogTitle} ogDescription={ogDescription} ogImage={ogImage} />
          )}

          <div className={styles.mobileNav}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
              disabled={!canGoPrev}
            >
              이전
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => setCurrentStep((step) => Math.min(STEP_ITEMS.length, step + 1))}
              disabled={!canGoNext}
            >
              다음
            </button>
          </div>
        </main>

        <aside className={styles.previewColumn}>
          <PreviewPanel data={state} title="라이브 미리보기" />
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
            <PreviewPanel data={state} />
          </div>
        </div>
      )}
    </div>
  );
}

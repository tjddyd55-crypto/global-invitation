'use client';

import { useReducer, useState } from 'react';
import styles from './funeralEditor.module.css';
import StepperNav, { type FuneralStep } from './components/StepperNav';
import PreviewPanel from './components/PreviewPanel';
import Step0Basic from './steps/Step0Basic';
import Step1Message from './steps/Step1Message';
import Step2Family from './steps/Step2Family';
import Step3Schedule from './steps/Step3Schedule';
import Step4Hall from './steps/Step4Hall';
import Step5Preview from './steps/Step5Preview';
import { funeralEditorReducer } from './state/funeralEditor.reducer';
import type { FuneralEditorState } from './state/funeralEditor.types';

const STEP_ITEMS: FuneralStep[] = [
  { id: 0, title: '기본 정보' },
  { id: 1, title: '인사말' },
  { id: 2, title: '상주/유가족' },
  { id: 3, title: '장례 일정' },
  { id: 4, title: '장례식장/지도' },
  { id: 5, title: '미리보기' },
];

type FuneralEditorProps = {
  initialState: FuneralEditorState;
  onSave?: (state: FuneralEditorState) => Promise<void> | void;
  saveNotice?: string | null;
  saveError?: string | null;
};

export default function FuneralEditor({ initialState, onSave, saveNotice, saveError }: FuneralEditorProps) {
  const [state, dispatch] = useReducer(funeralEditorReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const canGoPrev = currentStep > 0;
  const canGoNext = currentStep < STEP_ITEMS.length - 1;

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(state);
  };

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div>
          <h1 className={styles.editorTitle}>부고장 에디터</h1>
          <p className={styles.editorSubtitle}>입력 즉시 미리보기에 반영됩니다.</p>
          {saveNotice && <p className={styles.noticeText}>{saveNotice}</p>}
          {saveError && <p className={styles.errorText}>{saveError}</p>}
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.buttonPrimary} onClick={handleSave} disabled={!onSave}>
            저장
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
            <Step0Basic
              deceasedName={state.deceasedName}
              birthDate={state.birthDate}
              deathDate={state.deathDate}
              heroImage={state.heroImage}
              onChange={(payload) =>
                dispatch({
                  type: 'SET_BASIC',
                  payload: {
                    deceasedName: payload.deceasedName ?? state.deceasedName,
                    birthDate: payload.birthDate ?? state.birthDate,
                    deathDate: payload.deathDate ?? state.deathDate,
                    heroImage: payload.heroImage ?? state.heroImage,
                  },
                })
              }
            />
          )}
          {currentStep === 1 && (
            <Step1Message
              message={state.message}
              onChange={(message) => dispatch({ type: 'SET_MESSAGE', payload: { message } })}
            />
          )}
          {currentStep === 2 && (
            <Step2Family
              chiefMourner={state.chiefMourner}
              familyMembers={state.familyMembers}
              onChange={(payload) =>
                dispatch({
                  type: 'SET_FAMILY',
                  payload: {
                    chiefMourner: payload.chiefMourner ?? state.chiefMourner,
                    familyMembers: payload.familyMembers ?? state.familyMembers,
                  },
                })
              }
            />
          )}
          {currentStep === 3 && (
            <Step3Schedule
              schedule={state.schedule}
              onChange={(schedule) => dispatch({ type: 'SET_SCHEDULE', payload: schedule })}
            />
          )}
          {currentStep === 4 && (
            <Step4Hall
              funeralHall={state.funeralHall}
              contact={state.contact}
              onHallChange={(hall) => dispatch({ type: 'SET_HALL', payload: hall })}
              onContactChange={(contact) => dispatch({ type: 'SET_CONTACT', payload: contact })}
            />
          )}
          {currentStep === 5 && <Step5Preview data={state} />}

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
          <PreviewPanel data={state} />
        </aside>
      </div>

      <button
        type="button"
        className={styles.previewFloatingButton}
        onClick={() => setMobilePreviewOpen(true)}
      >
        Preview
      </button>

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

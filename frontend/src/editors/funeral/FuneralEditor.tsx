'use client';

import { useReducer, useState } from 'react';
import styles from './funeralEditor.module.css';
import PreviewPanel from './components/PreviewPanel';
import Step0Basic from './steps/Step0Basic';
import Step1Message from './steps/Step1Message';
import Step2HeroImage from './steps/Step2HeroImage';
import Step2Family from './steps/Step2Family';
import Step3Schedule from './steps/Step3Schedule';
import Step4Hall from './steps/Step4Hall';
import Step6AccountInfo from './steps/Step6AccountInfo';
import Step7Attendance from './steps/Step7Attendance';
import Step8ShareSettings from './steps/Step8ShareSettings';
import { funeralEditorReducer } from './state/funeralEditor.reducer';
import type { FuneralEditorState } from './state/funeralEditor.types';
import EditorHeader from '@/src/editors/shared/EditorHeader';
import UnifiedStepperNav, { type UnifiedStepItem } from '@/src/editors/shared/UnifiedStepperNav';

const STEP_ITEMS: UnifiedStepItem[] = [
  { id: 0, title: '기본 정보' },
  { id: 1, title: '부고문' },
  { id: 2, title: '대표 이미지' },
  { id: 3, title: '고인 정보' },
  { id: 4, title: '장례 일정' },
  { id: 5, title: '위치 안내' },
  { id: 6, title: '계좌 정보' },
  { id: 7, title: '참석 여부' },
  { id: 8, title: '공유 설정' },
];

type FuneralEditorProps = {
  initialState: FuneralEditorState;
  onSave?: (state: FuneralEditorState) => Promise<void> | void;
  onSaveAndExit?: (state: FuneralEditorState) => Promise<void> | void;
  onPublish?: (state: FuneralEditorState) => Promise<void> | void;
  saving?: boolean;
  publishing?: boolean;
  saveNotice?: string | null;
  saveError?: string | null;
  draftStatus?: 'draft' | 'published';
  lastSavedAt?: string | null;
};

export default function FuneralEditor({
  initialState,
  onSave,
  onSaveAndExit,
  onPublish,
  saving,
  publishing,
  saveNotice,
  saveError,
  draftStatus = 'draft',
  lastSavedAt,
}: FuneralEditorProps) {
  const [state, dispatch] = useReducer(funeralEditorReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

  return (
    <div className={styles.editorPage}>
      <EditorHeader
        title="부고장 에디터"
        conceptLabel="부고장"
        draftStatus={draftStatus}
        lastSavedAt={lastSavedAt}
        saveNotice={saveNotice}
        saveError={saveError}
        saving={saving}
        publishing={publishing}
        onSave={onSave ? handleSave : undefined}
        onSaveAndExit={onSaveAndExit ? handleSaveAndExit : undefined}
        onPublish={onPublish ? handlePublish : undefined}
      />

      <div className={styles.editorLayout}>
        <aside className={styles.navColumn}>
          <UnifiedStepperNav
            steps={STEP_ITEMS}
            currentStep={currentStep}
            onStepSelect={setCurrentStep}
            orientation="vertical"
          />
        </aside>

        <main className={styles.formColumn}>
          <div className={styles.mobileStepper}>
            <UnifiedStepperNav
              steps={STEP_ITEMS}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
              orientation="horizontal"
            />
          </div>

          <div className={styles.sectionStack}>
            {currentStep === 0 && (
              <Step0Basic
                deceasedName={state.deceasedName}
                birthDate={state.birthDate}
                deathDate={state.deathDate}
                onChange={(payload) =>
                  dispatch({
                    type: 'SET_BASIC',
                    payload: {
                      deceasedName: payload.deceasedName ?? state.deceasedName,
                      birthDate: payload.birthDate ?? state.birthDate,
                      deathDate: payload.deathDate ?? state.deathDate,
                      heroImage: state.heroImage,
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
              <Step2HeroImage
                heroImage={state.heroImage}
                onChange={(heroImage) =>
                  dispatch({
                    type: 'SET_BASIC',
                    payload: {
                      deceasedName: state.deceasedName,
                      birthDate: state.birthDate,
                      deathDate: state.deathDate,
                      heroImage,
                    },
                  })
                }
              />
            )}
            {currentStep === 3 && (
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
            {currentStep === 4 && (
              <Step3Schedule
                schedule={state.schedule}
                onChange={(schedule) => dispatch({ type: 'SET_SCHEDULE', payload: schedule })}
              />
            )}
            {currentStep === 5 && (
              <Step4Hall
                funeralHall={state.funeralHall}
                contact={state.contact}
                onHallChange={(hall) => dispatch({ type: 'SET_HALL', payload: hall })}
                onContactChange={(contact) => dispatch({ type: 'SET_CONTACT', payload: contact })}
              />
            )}
            {currentStep === 6 && <Step6AccountInfo />}
            {currentStep === 7 && <Step7Attendance />}
            {currentStep === 8 && <Step8ShareSettings />}
          </div>
        </main>

        <aside className={styles.previewColumn}>
          <div className={styles.previewFrameWrap}>
            <PreviewPanel data={state} />
          </div>
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

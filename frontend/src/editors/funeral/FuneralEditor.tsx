'use client';

import { useMemo, useReducer, useState } from 'react';
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
import { InvitationLocaleProvider } from '@/src/i18n/InvitationLocaleContext';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';

type FuneralEditorProps = {
  initialState: FuneralEditorState;
  locale?: ProductLocaleId;
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
  locale = 'ko-KR',
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
  const t = (key: string) => invitationT(locale, key);
  const stepItems: UnifiedStepItem[] = useMemo(
    () => [
      { id: 0, title: invitationT(locale, 'editor.section.basicInfo') },
      { id: 1, title: invitationT(locale, 'editor.section.memorialMessage') },
      { id: 2, title: invitationT(locale, 'editor.section.hero') },
      { id: 3, title: invitationT(locale, 'editor.section.deceased') },
      { id: 4, title: invitationT(locale, 'editor.section.schedule') },
      { id: 5, title: invitationT(locale, 'editor.section.location') },
      { id: 6, title: invitationT(locale, 'editor.section.accounts') },
      { id: 7, title: invitationT(locale, 'editor.section.rsvp') },
      { id: 8, title: invitationT(locale, 'editor.section.sharing') },
    ],
    [locale]
  );

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
    <InvitationLocaleProvider locale={locale}>
      <div className={styles.editorPage} data-testid="funeral-editor-root">
        <EditorHeader
          title={t('editor.header.titleFuneral')}
          conceptLabel={t('editor.concept.funeral')}
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
              steps={stepItems}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
              orientation="vertical"
            />
          </aside>

          <main className={styles.formColumn}>
            <div className={styles.mobileStepper}>
              <UnifiedStepperNav
                steps={stepItems}
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
          {t('editor.action.preview')}
        </button>

        {mobilePreviewOpen && (
          <div className={styles.previewOverlay}>
            <div className={styles.previewOverlayHeader}>
              <span>{t('editor.preview.live')}</span>
              <button type="button" className={styles.buttonGhost} onClick={() => setMobilePreviewOpen(false)}>
                {t('editor.preview.close')}
              </button>
            </div>
            <div className={styles.previewOverlayBody}>
              <PreviewPanel data={state} />
            </div>
          </div>
        )}
      </div>
    </InvitationLocaleProvider>
  );
}

'use client';

import { useReducer, useState } from 'react';
import styles from './messageSimpleEditor.module.css';
import Step0MainImage from './steps/Step0MainImage';
import Step1Content from './steps/Step1Content';
import Step2Schedule from './steps/Step2Schedule';
import Step3Preview from './steps/Step3Preview';
import MessageSimpleCard from '@/src/templates/messageSimple/MessageSimpleCard';
import type { MessageCardSimple } from '@/src/models/messageSimple';

type StepItem = {
  id: number;
  title: string;
};

const STEP_ITEMS: StepItem[] = [
  { id: 0, title: '메인 이미지' },
  { id: 1, title: '제목/메시지' },
  { id: 2, title: '일정' },
  { id: 3, title: '미리보기' },
];

type MessageSimpleEditorProps = {
  initialState: MessageCardSimple;
  onSave?: (state: MessageCardSimple) => Promise<void> | void;
  saveNotice?: string | null;
};

type EditorAction =
  | { type: 'SET_FIELDS'; payload: Partial<MessageCardSimple> }
  | { type: 'SET_SCHEDULE'; payload: MessageCardSimple['schedule'] };

function editorReducer(state: MessageCardSimple, action: EditorAction): MessageCardSimple {
  switch (action.type) {
    case 'SET_FIELDS':
      return { ...state, ...action.payload };
    case 'SET_SCHEDULE':
      return { ...state, schedule: action.payload };
    default:
      return state;
  }
}

export default function MessageSimpleEditor({ initialState, onSave, saveNotice }: MessageSimpleEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);

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
          <h1 className={styles.editorTitle}>Generic Message Card 에디터</h1>
          <p className={styles.editorSubtitle}>입력 즉시 미리보기에 반영됩니다.</p>
          {saveNotice && <p className={styles.noticeText}>{saveNotice}</p>}
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.buttonPrimary} onClick={handleSave} disabled={!onSave}>
            저장
          </button>
        </div>
      </header>

      <div className={styles.editorLayout}>
        <aside className={styles.navColumn}>
          <div className={styles.stepperNav}>
            {STEP_ITEMS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`${styles.stepperItem} ${currentStep === step.id ? styles.stepperItemActive : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <span className={styles.stepperIndex}>{step.id}</span>
                <span className={styles.stepperTitle}>{step.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.formColumn}>
          <div className={styles.mobileStepper}>
            <div className={styles.stepperNavHorizontal}>
              {STEP_ITEMS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={`${styles.stepperItem} ${currentStep === step.id ? styles.stepperItemActive : ''}`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <span className={styles.stepperIndex}>{step.id}</span>
                  <span className={styles.stepperTitle}>{step.title}</span>
                </button>
              ))}
            </div>
          </div>

          {currentStep === 0 && (
            <Step0MainImage
              heroImage={state.heroImage}
              onChange={(heroImage) => dispatch({ type: 'SET_FIELDS', payload: { heroImage } })}
            />
          )}
          {currentStep === 1 && (
            <Step1Content
              title={state.title}
              subtitle={state.subtitle}
              message={state.message}
              onChange={(payload) => dispatch({ type: 'SET_FIELDS', payload })}
            />
          )}
          {currentStep === 2 && (
            <Step2Schedule
              schedule={state.schedule}
              onChange={(schedule) => dispatch({ type: 'SET_SCHEDULE', payload: schedule })}
            />
          )}
          {currentStep === 3 && <Step3Preview data={state} />}

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
          <div className={styles.previewPanel}>
            <div className={styles.previewTitle}>라이브 미리보기</div>
            <div className={styles.previewFrame}>
              <MessageSimpleCard data={state} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

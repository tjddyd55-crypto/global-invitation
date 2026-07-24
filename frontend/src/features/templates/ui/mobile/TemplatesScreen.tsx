'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import {
  CONCEPT_OPTIONS,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import styles from './TemplatesScreen.module.css';

/**
 * 모바일 컨셉 선택 (Figma Make).
 * 선택 강조 후 "선택하고 시작하기"로 생성한다.
 */
export default function TemplatesScreen() {
  const { creatingConcept, error, start } = useCreateInvitation();
  const [selected, setSelected] = useState<ConceptType>('WEDDING');

  return (
    <RequireAuth nextPath="/m/templates">
      <section className={styles.screen}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>초대장 만들기</p>
          <h1 className={styles.title}>어떤 초대장을 만들까요?</h1>
          <p className={styles.desc}>
            컨셉을 선택하면 같은 에디터에서 바로 시작할 수 있습니다.
            선택한 컨셉은 이후 변경할 수 없습니다.
          </p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.cardList} role="radiogroup" aria-label="초대장 컨셉">
          {CONCEPT_OPTIONS.map((concept) => {
            const isSelected = selected === concept.value;
            return (
              <button
                key={concept.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.conceptCard} ${isSelected ? styles.conceptCardSelected : ''}`}
                onClick={() => setSelected(concept.value)}
                data-testid={`concept-option-${concept.value.toLowerCase()}`}
              >
                <span className={styles.accent} style={{ background: concept.accent }} />
                <div className={styles.cardTop}>
                  <span className={styles.icon}>{concept.icon}</span>
                  {isSelected && <span className={styles.check}>✓</span>}
                </div>
                <span className={styles.cardTitle}>{concept.label}</span>
                <span className={styles.cardDesc}>{concept.description}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.cta}
          onClick={() => void start(selected)}
          disabled={Boolean(creatingConcept)}
          data-testid="concept-start-cta"
        >
          {creatingConcept ? '생성 중...' : '선택하고 시작하기'}
        </button>

        <p className={styles.footer}>
          이미 만든 초대장은 <Link href="/m/my-invitations">내 초대장</Link>에서 확인하세요.
        </p>
      </section>
    </RequireAuth>
  );
}

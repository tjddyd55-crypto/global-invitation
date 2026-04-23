'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import { CONCEPT_OPTIONS, useCreateInvitation } from '@/src/features/templates/model/useCreateInvitation';
import styles from './TemplatesPage.module.css';

/**
 * PC 템플릿 탐색 페이지.
 * - 좌: FULL 엔진 라이브 프리뷰
 * - 우: 컨셉별 "바로 시작하기" 카드 리스트
 * - 모바일 UI 와 동일한 `useCreateInvitation` 훅을 공유한다.
 */
export default function TemplatesPage() {
  const { creatingConcept, error, start } = useCreateInvitation();

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <h1>템플릿으로 시작</h1>
        <p>FULL 엔진 하나로 모든 컨셉을 커버합니다. 원하는 컨셉을 고르면 편집기로 이동합니다.</p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.grid}>
        <div className={styles.previewCard}>
          <div className={styles.previewFrame}>
            <span className={styles.previewLabel}>FULL · Concept-driven</span>
            <TemplatePreviewWrapper templateKey="invitation_full" />
          </div>
        </div>

        <div className={styles.rightPanel}>
          {CONCEPT_OPTIONS.map((concept) => (
            <div key={concept.value} className={styles.conceptCard}>
              <div className={styles.conceptText}>
                <span className={styles.conceptLabel}>{concept.icon} {concept.label}</span>
                <span className={styles.conceptDesc}>{concept.description}</span>
              </div>
              <button
                type="button"
                className={styles.conceptButton}
                onClick={() => start(concept.value)}
                disabled={Boolean(creatingConcept)}
                data-testid={`concept-create-${concept.value.toLowerCase()}`}
              >
                {creatingConcept === concept.value ? '생성 중...' : '시작하기'}
              </button>
            </div>
          ))}

          <div className={styles.footerLink}>
            <Link href="/pc/my-invitations">내 초대장 관리 →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

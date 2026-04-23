'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { CONCEPT_OPTIONS, useCreateInvitation } from '@/src/features/templates/model/useCreateInvitation';
import styles from './TemplatesScreen.module.css';

/**
 * 모바일 템플릿 탐색 화면.
 * - PWA 우선: 단일 FULL 엔진 + 컨셉 선택의 빠른 경로만 노출.
 * - 상세 템플릿 목록·필터링은 PC 전용 기능.
 */
export default function TemplatesScreen() {
  const { creatingConcept, error, start } = useCreateInvitation();

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h1>템플릿으로 시작</h1>
        <p>컨셉을 고르면 바로 편집 화면으로 이동합니다.</p>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.cardList}>
        {CONCEPT_OPTIONS.map((concept) => {
          const isCreating = creatingConcept === concept.value;
          return (
            <article key={concept.value} className={styles.card}>
              <span className={styles.accent} style={{ background: concept.accent }} />
              <div className={styles.cardHeader}>
                <span className={styles.icon}>{concept.icon}</span>
                <span className={styles.title}>{concept.label}</span>
              </div>
              <p className={styles.desc}>{concept.description}</p>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => start(concept.value)}
                disabled={Boolean(creatingConcept)}
                data-testid={`concept-create-${concept.value.toLowerCase()}`}
              >
                {isCreating ? '생성 중...' : `${concept.label}으로 시작`}
              </button>
            </article>
          );
        })}
      </div>

      <p className={styles.footer}>
        이미 만든 게 있으신가요? <Link href="/m/my-invitations">내 초대장</Link>
      </p>
    </section>
  );
}

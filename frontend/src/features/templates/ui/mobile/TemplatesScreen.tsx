'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import {
  CONCEPT_OPTIONS,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import { appPath, resolveAppNavPrefix } from '@/src/shared/platform/appNavPrefix';
import styles from './TemplatesScreen.module.css';

/**
 * 모바일 컨셉 선택 (Figma Make 375px).
 * 선택 강조 후 "선택하고 시작하기"로 생성한다.
 */
export default function TemplatesScreen() {
  const { creatingConcept, error, start } = useCreateInvitation();
  const [selected, setSelected] = useState<ConceptType>('WEDDING');
  const pathname = usePathname() ?? '';
  const prefix = resolveAppNavPrefix(pathname);
  const myInvitationsHref = appPath(prefix, '/my-invitations');
  const conceptHref = appPath(prefix, '/create/concept');

  return (
    <RequireAuth nextPath={conceptHref}>
      <section className={styles.screen} data-testid="mobile-concept-screen">
        <header className={styles.header}>
          <p className={styles.eyebrow}>초대장 만들기</p>
          <h1 className={styles.title}>어떤 초대장을 만들까요?</h1>
          <p className={styles.desc}>
            컨셉을 선택하면 같은 에디터에서 바로 시작할 수 있습니다.
          </p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.cardList} role="radiogroup" aria-label="초대장 컨셉">
          {CONCEPT_OPTIONS.map((concept) => {
            const isSelected = selected === concept.value;
            const Icon = concept.Icon;
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
                  <span className={styles.iconWrap} style={{ color: concept.accent }}>
                    <Icon size={26} />
                  </span>
                  {isSelected ? <span className={styles.check} aria-hidden>✓</span> : null}
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
          이미 만든 초대장은 <Link href={myInvitationsHref}>내 초대장</Link>에서 확인하세요.
        </p>
      </section>
    </RequireAuth>
  );
}

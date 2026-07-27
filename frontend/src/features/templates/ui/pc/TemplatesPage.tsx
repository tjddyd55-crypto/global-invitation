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
import styles from './TemplatesPage.module.css';

/**
 * PC 컨셉 선택 (Figma Make: 3열 카드 + 하단 CTA).
 */
export default function TemplatesPage() {
  const { creatingConcept, error, start } = useCreateInvitation();
  const [selected, setSelected] = useState<ConceptType>('WEDDING');
  const pathname = usePathname() ?? '';
  const prefix = resolveAppNavPrefix(pathname);
  const myInvitationsHref = appPath(prefix, '/my-invitations');
  const templatesHref = appPath(prefix, '/templates');

  return (
    <RequireAuth nextPath={templatesHref}>
      <section className={styles.root}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>초대장 만들기</p>
          <h1>어떤 초대장을 만들까요?</h1>
          <p>컨셉을 고르면 동일한 에디터 시스템에서 바로 시작할 수 있습니다.</p>
        </header>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.grid} role="radiogroup" aria-label="초대장 컨셉">
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
                <div className={styles.cardTop}>
                  <span className={styles.icon} style={{ color: concept.accent }}>
                    <Icon size={28} />
                  </span>
                  {isSelected && <span className={styles.check}>✓</span>}
                </div>
                <span className={styles.cardTitle}>{concept.label}</span>
                <span className={styles.cardDesc}>{concept.description}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.footerBar}>
          <Link href={myInvitationsHref} className={styles.footerLink}>
            내 초대장 관리 →
          </Link>
          <button
            type="button"
            className={styles.cta}
            onClick={() => void start(selected)}
            disabled={Boolean(creatingConcept)}
            data-testid="concept-start-cta"
          >
            {creatingConcept ? '생성 중...' : '선택하고 시작하기'}
          </button>
        </div>
      </section>
    </RequireAuth>
  );
}

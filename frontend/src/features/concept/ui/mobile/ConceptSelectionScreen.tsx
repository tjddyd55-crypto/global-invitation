'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import {
  CONCEPT_OPTIONS,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import { CheckIcon, ChevronLeftIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './ConceptSelectionScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

/**
 * Figma Make `ConceptSelectionScreen` — 모바일 컨셉 선택 (canonical `/create/concept`).
 */
export default function ConceptSelectionScreen() {
  const { status } = useAuth();
  const [selected, setSelected] = useState<ConceptType>('WEDDING');
  const { creatingConcept, error, start } = useCreateInvitation();
  const myInvitationsHref =
    status === 'authenticated'
      ? MY_INVITATIONS_PATH
      : `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;

  return (
    <RequireAuth nextPath={CONCEPT_CREATE_PATH}>
      <section className={styles.screen} data-testid="mobile-concept-screen">
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink} aria-label="홈으로">
            <ChevronLeftIcon size={20} />
          </Link>
          <span className={styles.topBarTitle}>초대장 만들기</span>
          <span className={styles.topBarSpacer} aria-hidden />
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>어떤 초대장을 만들까요?</h1>
          <p className={styles.desc}>컨셉을 선택하면 같은 에디터에서 바로 시작할 수 있습니다.</p>
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
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(concept.value)}
                data-testid={`concept-option-${concept.value.toLowerCase()}`}
              >
                <div className={styles.cardTop}>
                  <span
                    className={styles.iconWrap}
                    style={{ background: concept.accentSoft, color: concept.accent }}
                  >
                    <Icon size={24} />
                  </span>
                  {isSelected && (
                    <span className={styles.checkBadge} style={{ background: concept.accent }}>
                      <CheckIcon size={13} />
                    </span>
                  )}
                </div>
                <span className={styles.cardTitle}>{concept.label}</span>
                <span className={styles.cardDesc}>{concept.description}</span>
                <ul className={styles.featureList}>
                  {concept.features.slice(0, 4).map((feature) => (
                    <li key={feature} className={styles.featureTag}>
                      {feature}
                    </li>
                  ))}
                  {concept.features.length > 4 && (
                    <li className={styles.featureTagMore}>+{concept.features.length - 4}</li>
                  )}
                </ul>
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

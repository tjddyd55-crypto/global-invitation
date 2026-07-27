'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/shared/hooks';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import {
  CONCEPT_OPTIONS,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import { CheckIcon, ChevronLeftIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './DesktopConceptSelectionScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';
const MY_INVITATIONS_PATH = '/my-invitations';

/**
 * Figma Make `DesktopConceptSelectionScreen` — 데스크톱 컨셉 선택 (`>=1024px`, canonical `/create/concept`).
 * 인증 가드(`RequireAuth`)는 유지하되, 화면 자체는 Figma 마케팅 톤(`--mk-*`)으로 렌더링한다.
 */
export default function DesktopConceptSelectionScreen() {
  const { status } = useAuth();
  const [selected, setSelected] = useState<ConceptType>('WEDDING');
  const { creatingConcept, error, start } = useCreateInvitation();
  const createHref =
    status === 'authenticated'
      ? CONCEPT_CREATE_PATH
      : `/auth/email?next=${encodeURIComponent(CONCEPT_CREATE_PATH)}`;
  const myInvitationsHref =
    status === 'authenticated'
      ? MY_INVITATIONS_PATH
      : `/auth/email?next=${encodeURIComponent(MY_INVITATIONS_PATH)}`;

  return (
    <RequireAuth nextPath={CONCEPT_CREATE_PATH}>
      <div className={styles.page}>
        <MarketingDesktopHeader
          showNav={false}
          isLoggedIn={status === 'authenticated'}
          createHref={createHref}
          myInvitationsHref={myInvitationsHref}
        />

        <main className={styles.main}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeftIcon size={16} />
            홈으로
          </Link>

          <header className={styles.header}>
            <p className={styles.eyebrow}>초대장 만들기</p>
            <h1 className={styles.title}>어떤 초대장을 만들까요?</h1>
            <p className={styles.desc}>컨셉을 고르면 동일한 에디터 시스템에서 바로 시작할 수 있습니다.</p>
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
                  className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                  onClick={() => setSelected(concept.value)}
                  data-testid={`concept-option-${concept.value.toLowerCase()}`}
                >
                  <div className={styles.cardTop}>
                    <span
                      className={styles.iconWrap}
                      style={{ background: concept.accentSoft, color: concept.accent }}
                    >
                      <Icon size={26} />
                    </span>
                    {isSelected && (
                      <span className={styles.checkBadge} style={{ background: concept.accent }}>
                        <CheckIcon size={14} />
                      </span>
                    )}
                  </div>
                  <span className={styles.cardTitle}>{concept.label}</span>
                  <span className={styles.cardDesc}>{concept.description}</span>
                  <ul className={styles.featureList}>
                    {concept.features.map((feature) => (
                      <li key={feature} className={styles.featureItem}>
                        <CheckIcon size={14} className={styles.featureIcon} style={{ color: concept.accent }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
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
        </main>
      </div>
    </RequireAuth>
  );
}

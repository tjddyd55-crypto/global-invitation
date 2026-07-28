'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import {
  CONCEPT_OPTIONS,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import { ArrowRightIcon, CheckIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './DesktopConceptSelectionScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';

/**
 * Figma Make `DesktopConceptSelectionScreen` — MCP 소스 구조/카피 SSOT.
 * RequireAuth + useCreateInvitation 비즈니스 로직은 유지한다.
 */
export default function DesktopConceptSelectionScreen() {
  const [selected, setSelected] = useState<ConceptType | null>(null);
  const { creatingConcept, error, start } = useCreateInvitation();

  return (
    <RequireAuth nextPath={CONCEPT_CREATE_PATH}>
      <div className={styles.page} data-testid="desktop-concept-screen">
        <MarketingDesktopHeader showNav={false} />

        <div className={styles.progressTrack} aria-hidden>
          <div className={styles.progressFill} />
        </div>

        <main className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.title}>어떤 초대장을 만들까요?</h1>
            <p className={styles.desc}>초대장 종류를 먼저 선택하면 그에 맞는 입력 항목으로 시작합니다.</p>
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
                  className={styles.card}
                  style={
                    isSelected
                      ? {
                          borderColor: concept.accent,
                          background: `${concept.accent}0D`,
                          boxShadow: `0 0 0 4px ${concept.accent}26, 0 8px 24px rgba(0,0,0,0.08)`,
                        }
                      : undefined
                  }
                  onClick={() => setSelected(concept.value)}
                  data-testid={`concept-option-${concept.value.toLowerCase()}`}
                >
                  {isSelected && (
                    <span className={styles.checkBadge} style={{ background: concept.accent }}>
                      <CheckIcon size={16} />
                    </span>
                  )}

                  <span className={styles.iconWrap} style={{ background: concept.accentSoft, color: concept.accent }}>
                    <Icon size={28} />
                  </span>

                  <span className={styles.badge} style={{ background: concept.accentSoft, color: concept.accent }}>
                    {concept.badge}
                  </span>

                  <span className={styles.cardTitle}>{concept.label}</span>
                  <span className={styles.cardDesc}>{concept.description}</span>

                  <ul className={styles.featureList}>
                    {concept.features.map((feature) => (
                      <li key={feature} className={styles.featureItem}>
                        <span
                          className={styles.featureDot}
                          style={{
                            background: isSelected ? concept.accent : concept.accentSoft,
                            color: isSelected ? '#fff' : concept.accent,
                          }}
                        >
                          <CheckIcon size={10} />
                        </span>
                        <span style={{ color: isSelected ? '#374151' : '#6b7280', fontWeight: isSelected ? 500 : 400 }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <button
              type="button"
              className={`${styles.cta} ${selected ? styles.ctaActive : ''}`}
              onClick={() => selected && void start(selected)}
              disabled={!selected || Boolean(creatingConcept)}
              data-testid="concept-start-cta"
            >
              {creatingConcept ? '생성 중...' : '선택하고 시작하기'}
              <ArrowRightIcon size={18} />
            </button>
          </div>
        </main>
        <SiteBusinessFooter />
      </div>
    </RequireAuth>
  );
}

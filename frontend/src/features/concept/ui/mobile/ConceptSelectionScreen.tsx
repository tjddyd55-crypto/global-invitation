'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import AuthBrandHeader from '@/src/features/marketing/ui/AuthBrandHeader';
import SiteBusinessFooter from '@/src/components/layout/SiteBusinessFooter';
import {
  localizeConceptOptions,
  type ConceptType,
  useCreateInvitation,
} from '@/src/features/templates/model/useCreateInvitation';
import { useI18n } from '@/src/contexts/I18nContext';
import { ArrowRightIcon, ChevronLeftIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './ConceptSelectionScreen.module.css';

const CONCEPT_CREATE_PATH = '/create/concept';

/**
 * Figma Make `ConceptSelectionScreen` — MCP 소스 구조/카피 SSOT.
 */
export default function ConceptSelectionScreen() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<ConceptType | null>(null);
  const { creatingConcept, error, start } = useCreateInvitation();
  const concepts = localizeConceptOptions(t);

  return (
    <RequireAuth nextPath={CONCEPT_CREATE_PATH}>
      <section className={styles.screen} data-testid="mobile-concept-screen">
        <div className={styles.topBar}>
          <Link href="/" className={styles.backButton} aria-label="홈으로">
            <ChevronLeftIcon size={20} />
          </Link>
          <AuthBrandHeader variant="inline" />
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{t('concept.picker.title')}</h1>
          <p className={styles.desc}>{t('concept.picker.desc')}</p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.cardList} role="radiogroup" aria-label={t('concept.picker.aria')}>
          {concepts.map((concept) => {
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
                        background: concept.accentActiveBg,
                        borderColor: concept.accent,
                        boxShadow: `0 0 0 4px ${concept.accent}26`,
                      }
                    : undefined
                }
                onClick={() => setSelected(concept.value)}
                data-testid={`concept-option-${concept.value.toLowerCase()}`}
              >
                <span className={styles.iconWrap} style={{ background: concept.accentSoft, color: concept.accent }}>
                  <Icon size={22} />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitleRow}>
                    <span className={styles.cardTitle}>{concept.label}</span>
                    <span className={styles.badge} style={{ background: concept.accentSoft, color: concept.accent }}>
                      {concept.badge}
                    </span>
                  </span>
                  <span className={styles.cardFields}>{concept.fieldsSummary}</span>
                </span>
                {isSelected && (
                  <span className={styles.checkBadge} style={{ background: concept.accent }} aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.ctaWrap}>
          <button
            type="button"
            className={`${styles.cta} ${selected ? styles.ctaActive : ''}`}
            onClick={() => selected && void start(selected)}
            disabled={!selected || Boolean(creatingConcept)}
            data-testid="concept-start-cta"
          >
            {creatingConcept ? t('concept.picker.creating') : t('concept.picker.cta')}
            <ArrowRightIcon size={18} />
          </button>
        </div>
        <SiteBusinessFooter />
      </section>
    </RequireAuth>
  );
}

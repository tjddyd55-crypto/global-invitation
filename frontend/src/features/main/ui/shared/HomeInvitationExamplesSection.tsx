'use client';
/* eslint-disable i18next/no-literal-string */

import { listHomeInvitationExamples } from '@/src/features/main/model/homeInvitationPreview';
import { useI18n } from '@/src/contexts/I18nContext';
import { useNearViewport } from '@/src/features/main/model/useNearViewport';
import HomeInvitationPreviewFrame from './HomeInvitationPreviewFrame';
import styles from './HomeInvitationExamplesSection.module.css';

type HomeInvitationExamplesSectionProps = {
  layout?: 'desktop' | 'mobile';
};

const EXAMPLE_COPY_KEYS = {
  wedding: {
    label: 'marketing.examples.wedding.label',
    caption: 'marketing.examples.wedding.caption',
  },
  funeral: {
    label: 'marketing.examples.funeral.label',
    caption: 'marketing.examples.funeral.caption',
  },
  general: {
    label: 'marketing.examples.general.label',
    caption: 'marketing.examples.general.caption',
  },
  organization: {
    label: 'marketing.examples.organization.label',
    caption: 'marketing.examples.organization.caption',
  },
} as const;

export default function HomeInvitationExamplesSection({
  layout = 'desktop',
}: HomeInvitationExamplesSectionProps) {
  const { t } = useI18n();
  const examples = listHomeInvitationExamples();
  const { ref, isNear } = useNearViewport(true);

  return (
    <section
      ref={ref}
      className={styles.section}
      data-layout={layout}
      id="examples"
      data-testid="home-invitation-examples"
    >
      <div className={styles.head}>
        <p className={styles.eyebrow}>{t('marketing.examples.eyebrow')}</p>
        <h2 className={styles.title}>{t('marketing.examples.title')}</h2>
        <p className={styles.lead}>{t('marketing.examples.lead')}</p>
      </div>
      <div className={styles.grid}>
        {examples.map((example) => (
          <article key={example.id} className={styles.card}>
            <HomeInvitationPreviewFrame example={example} size="card" mount={isNear} />
            <h3 className={styles.label}>{t(EXAMPLE_COPY_KEYS[example.id].label)}</h3>
            <p className={styles.caption}>{t(EXAMPLE_COPY_KEYS[example.id].caption)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

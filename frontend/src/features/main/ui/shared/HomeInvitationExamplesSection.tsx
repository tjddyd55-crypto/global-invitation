'use client';
/* eslint-disable i18next/no-literal-string */

import { listHomeInvitationExamples } from '@/src/features/main/model/homeInvitationPreview';
import { useNearViewport } from '@/src/features/main/model/useNearViewport';
import HomeInvitationPreviewFrame from './HomeInvitationPreviewFrame';
import styles from './HomeInvitationExamplesSection.module.css';

type HomeInvitationExamplesSectionProps = {
  layout?: 'desktop' | 'mobile';
};

export default function HomeInvitationExamplesSection({
  layout = 'desktop',
}: HomeInvitationExamplesSectionProps) {
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
        <p className={styles.eyebrow}>완성 예시</p>
        <h2 className={styles.title}>이렇게 만들어집니다</h2>
        <p className={styles.lead}>결혼식, 부고, 일반 행사, 기업·단체 행사 — 실제 초대장 완성본입니다.</p>
      </div>
      <div className={styles.grid}>
        {examples.map((example) => (
          <article key={example.id} className={styles.card}>
            <HomeInvitationPreviewFrame example={example} size="card" mount={isNear} />
            <h3 className={styles.label}>{example.label}</h3>
            <p className={styles.caption}>{example.caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

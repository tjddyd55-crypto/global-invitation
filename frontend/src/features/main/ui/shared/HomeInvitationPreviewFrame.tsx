'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo } from 'react';
import Link from 'next/link';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import {
  getHomeInvitationExample,
  getHomeInvitationExampleData,
  type HomeInvitationExample,
  type HomeInvitationExampleId,
} from '@/src/features/main/model/homeInvitationPreview';
import { useNearViewport } from '@/src/features/main/model/useNearViewport';
import styles from './HomeInvitationPreviewFrame.module.css';

type HomeInvitationPreviewFrameProps = {
  exampleId?: HomeInvitationExampleId;
  example?: HomeInvitationExample;
  size?: 'hero' | 'compact' | 'card';
  showGlow?: boolean;
  defer?: boolean;
};

export default function HomeInvitationPreviewFrame({
  exampleId = 'wedding',
  example,
  size = 'hero',
  showGlow = false,
  defer = false,
}: HomeInvitationPreviewFrameProps) {
  const resolved = example ?? getHomeInvitationExample(exampleId);
  const { ref, isNear } = useNearViewport(defer);
  const data = useMemo(
    () => (isNear ? getHomeInvitationExampleData(resolved.id) : null),
    [isNear, resolved.id]
  );

  return (
    <div
      ref={ref}
      className={styles.shell}
      data-size={size}
      data-testid={size === 'hero' || size === 'compact' ? 'home-invitation-preview' : `home-example-${resolved.id}`}
    >
      {showGlow ? <div className={styles.glow} aria-hidden /> : null}
      <div className={styles.phone}>
        <div className={styles.notch} aria-hidden />
        <div className={styles.clip}>
          {data ? (
            <div className={styles.scale}>
              <FullInvitationRenderer
                data={data}
                previewMode
                renderMode="TEMPLATE_PREVIEW"
                visualTemplateIdOverride={resolved.visualTemplateId}
                showRsvp={resolved.concept !== 'FUNERAL'}
                showGuestbook={false}
              />
            </div>
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>
        <Link href={resolved.href} className={styles.hit} aria-label={`${resolved.label} 완성 예시 보기`} />
      </div>
    </div>
  );
}

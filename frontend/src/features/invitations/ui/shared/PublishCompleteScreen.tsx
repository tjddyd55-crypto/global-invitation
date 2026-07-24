'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import GlobalSharePanel from '@/src/components/share/GlobalSharePanel';
import styles from './PublishCompleteScreen.module.css';

type PublishCompleteScreenProps = {
  invitationId: string;
  shareUrl: string;
  title?: string | null;
};

/**
 * 공개 완료 화면 (Figma Make: Publish Complete).
 */
export default function PublishCompleteScreen({
  invitationId,
  shareUrl,
  title,
}: PublishCompleteScreenProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Publish Complete</p>
        <h1>초대장이 공개되었습니다</h1>
        <p>{title?.trim() || '초대장'}을 공유하고 참석 응답을 관리해 보세요.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <GlobalSharePanel
            shareUrl={shareUrl}
            title={title || '초대장'}
            text={`${title || '초대장'}을 확인해 주세요.`}
          />
        </div>
        <aside className={styles.sideColumn}>
          <Link href={shareUrl} className={styles.primaryLink} target="_blank" rel="noreferrer">
            완성 초대장 보기
          </Link>
          <Link href={`/my-invitations/${invitationId}/rsvp`} className={styles.secondaryLink}>
            RSVP 관리
          </Link>
          <Link href={`/editor/${invitationId}`} className={styles.secondaryLink}>
            에디터로 돌아가기
          </Link>
          <Link href="/my-invitations" className={styles.ghostLink}>
            내 초대장 목록
          </Link>
        </aside>
      </div>
    </section>
  );
}

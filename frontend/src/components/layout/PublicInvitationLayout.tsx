import type { ReactNode } from 'react';
import styles from './PublicInvitationLayout.module.css';

/**
 * 공개 초대장 전용 레이아웃.
 * - SaaS GlobalHeader / 앱 shell 없음
 * - 배경·min-height 만 제공 (본문 구조는 page 담당)
 */
export default function PublicInvitationLayout({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

'use client';

/**
 * Dev Hub: 현재 프로젝트 무결성·작업 상태 확인 진입점.
 * API 호출 없음. 링크 카드만 표시.
 */

import Link from 'next/link';
import styles from './DevHub.module.css';

const CARDS = [
  {
    title: 'Invitations Demo',
    description: '초대장 데모·샘플 보기 및 에디터 진입.',
    href: '/invitation/sample-wedding',
  },
  {
    title: 'Integrity Dashboard',
    description: 'UI / API / Contract / Router / Feature Flag 무결성 상태 (선언 기반).',
    href: '/dev/integrity',
  },
  {
    title: 'Contracts & Governance',
    description: 'Runtime Contract, Backend Stub, 변경 거버넌스 문서 참조.',
    href: '/dev/contracts',
  },
  {
    title: 'Environment Status',
    description: 'Stub / API / 결제·이벤트 등 환경별 상태 요약.',
    href: '/dev/env',
  },
] as const;

export default function DevHubPage() {
  return (
    <>
      <h1 className={styles.title}>Dev Hub</h1>
      <p className={styles.subtitle}>
        현재 프로젝트 무결성과 작업 상태를 한눈에 확인합니다.
      </p>
      <div className={styles.cardGrid}>
        {CARDS.map((card) => (
          <div key={card.href} className={styles.card}>
            <h2 className={styles.cardTitle}>{card.title}</h2>
            <p className={styles.cardDescription}>{card.description}</p>
            <Link href={card.href} className={styles.cardLink}>
              이동 →
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

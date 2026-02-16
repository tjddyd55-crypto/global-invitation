'use client';

/**
 * Environment Status: Stub / API / 결제·이벤트 등 환경별 상태 (선언 기반).
 * 실제 process.env 또는 런타임 검사 없음.
 */

import Link from 'next/link';
import styles from '../DevHub.module.css';

type Status = 'PASS' | 'INTENTIONAL_DISABLED' | 'BLOCKED';

const ROWS: { name: string; description: string; status: Status }[] = [
  { name: 'Backend API', description: '실서버 API 호출 미사용. Stub만 사용.', status: 'INTENTIONAL_DISABLED' },
  { name: 'Invitation fetch', description: 'invitation/editor에서 GET /api/invitations/:slug 호출 안 함.', status: 'INTENTIONAL_DISABLED' },
  { name: '결제 (Stripe/Lemon)', description: '결제 플로우 비활성화.', status: 'BLOCKED' },
  { name: '이메일 발송', description: '매직 링크·알림 등 이메일 전송 비활성화.', status: 'BLOCKED' },
  { name: '이벤트 로깅', description: 'analytics/events API 호출 비활성화.', status: 'INTENTIONAL_DISABLED' },
  { name: 'Demo/Sample 데이터', description: '로컬 상수·getSampleWeddingInvitation 등만 사용.', status: 'PASS' },
];

const STATUS_CLASS: Record<Status, string> = {
  PASS: styles.statusPass,
  INTENTIONAL_DISABLED: styles.statusDisabled,
  BLOCKED: styles.statusBlocked,
};

export default function DevEnvPage() {
  return (
    <>
      <div className={styles.backBar}>
        <Link href="/dev" className={styles.backLink}>← Dev Hub</Link>
      </div>
      <h1 className={styles.title}>Environment Status</h1>
      <p className={styles.subtitle}>
        선언 기반 요약입니다. 실제 환경 변수·런타임 검사는 하지 않습니다.
      </p>
      <section className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>항목</th>
              <th className={styles.th}>설명</th>
              <th className={styles.th}>상태</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td className={styles.td}>{row.name}</td>
                <td className={styles.td}>{row.description}</td>
                <td className={styles.td}>
                  <span className={STATUS_CLASS[row.status]}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

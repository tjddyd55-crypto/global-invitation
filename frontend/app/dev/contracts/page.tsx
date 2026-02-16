'use client';

/**
 * Contracts & Governance: 참조 문서 목록. API 호출 없음.
 */

import Link from 'next/link';
import styles from '../DevHub.module.css';

const DOCS = [
  { name: 'INVITATION_RUNTIME_CONTRACT.md', desc: '초대장 Runtime Data Contract (Frontend SSOT)' },
  { name: 'INVITATION_BACKEND_STUB.md', desc: 'Backend Stub 단계 정의·호출 금지' },
  { name: 'CHANGE_GOVERNANCE.md', desc: '변경 거버넌스' },
  { name: '01_CURRENT_PHASE.md', desc: '현재 단계·SIMPLE MVP 범위' },
  { name: '02_STRIPE_POLICY.md', desc: '결제 정책 (비활성 시 참고)' },
] as const;

export default function DevContractsPage() {
  return (
    <>
      <div className={styles.backBar}>
        <Link href="/dev" className={styles.backLink}>← Dev Hub</Link>
      </div>
      <h1 className={styles.title}>Contracts & Governance</h1>
      <p className={styles.subtitle}>
        프로젝트 루트 docs/ 폴더 내 참조 문서입니다. 리포지터리에서 확인하세요.
      </p>
      <section className={styles.section}>
        <ul className={styles.docList}>
          {DOCS.map((doc) => (
            <li key={doc.name} className={styles.docListItem}>
              <strong>{doc.name}</strong>
              <span className={styles.docDesc}>{doc.desc}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

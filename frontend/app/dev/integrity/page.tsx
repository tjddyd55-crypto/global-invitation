'use client';

/**
 * Integrity Dashboard: UI / API / Contract / Router / Feature Flag 무결성 (선언 기반).
 * 실제 로직 검사 없음. “현재 설계 기준에서 선언된 상태”만 표시.
 * 신규 인원이 이 페이지만 봐도 규칙 이해 가능하도록 구성.
 */

import Link from 'next/link';
import styles from '../DevHub.module.css';

type Status = 'PASS' | 'INTENTIONAL_DISABLED' | 'BLOCKED';

type IntegrityRow = {
  name: string;
  description: string;
  status: Status;
  docRef: string;
};

type Section = {
  title: string;
  description: string;
  items: IntegrityRow[];
};

// 선언 기반 상태만 사용 (실제 검사 ❌)
const SECTIONS: Section[] = [
  {
    title: 'UI Integrity',
    description: 'Contract 필드·비활성 블록·갤러리 빈 배열 등 UI 동작 기준.',
    items: [
      { name: 'Contract 필드 누락 없음', description: 'FULL 템플릿이 Contract 정의 필드만 사용.', status: 'PASS', docRef: 'docs/INVITATION_RUNTIME_CONTRACT.md' },
      { name: '비활성 블록(display:none) 유지', description: 'RSVP 비활성 시 해당 섹션 숨김 유지.', status: 'PASS', docRef: 'docs/INVITATION_RUNTIME_CONTRACT.md' },
      { name: 'Gallery empty → section hidden', description: '갤러리 빈 배열이면 섹션 미표시.', status: 'PASS', docRef: 'docs/INVITATION_RUNTIME_CONTRACT.md' },
    ],
  },
  {
    title: 'API Integrity',
    description: 'Stub 단계: invitation/editor에서 fetch 0건, demo/sample만 로컬 데이터.',
    items: [
      { name: 'Invitation page fetch', description: 'invitation/[slug]에서 API 호출 없음.', status: 'INTENTIONAL_DISABLED', docRef: 'docs/INVITATION_BACKEND_STUB.md' },
      { name: 'Editor save/load', description: 'editor/[slug] 저장·로드는 로컬/Stub만.', status: 'INTENTIONAL_DISABLED', docRef: 'docs/INVITATION_BACKEND_STUB.md' },
      { name: 'Backend API 호출', description: '실제 Backend API 호출 미활성화.', status: 'BLOCKED', docRef: 'docs/INVITATION_BACKEND_STUB.md' },
    ],
  },
  {
    title: 'Contract Integrity',
    description: 'INVITATION_RUNTIME_CONTRACT.md 기준, 문서 없는 필드 접근 없음.',
    items: [
      { name: 'Runtime Contract 준수', description: 'UI가 Contract 정의 필드만 접근.', status: 'PASS', docRef: 'docs/INVITATION_RUNTIME_CONTRACT.md' },
      { name: '문서 없는 접근', description: '문서에 없는 필드 접근 0건.', status: 'PASS', docRef: 'docs/INVITATION_RUNTIME_CONTRACT.md' },
    ],
  },
  {
    title: 'Router Integrity',
    description: '/invitation/[slug], /editor/[slug] 및 not_found 분기.',
    items: [
      { name: '/invitation/[slug] 존재', description: '초대장 뷰 라우트 정상.', status: 'PASS', docRef: 'docs/INVITATION_OPERATION_CHECKLIST.md' },
      { name: '/editor/[slug] demo 전용', description: '에디터는 demo/sample slug만 허용.', status: 'PASS', docRef: 'docs/INVITATION_BACKEND_STUB.md' },
      { name: 'not_found 분기', description: '미존재 slug 시 not_found 처리.', status: 'PASS', docRef: 'docs/INVITATION_OPERATION_CHECKLIST.md' },
    ],
  },
  {
    title: 'Feature Flag / Governance',
    description: 'SIMPLE MVP 미변경, Backend Stub 유지, 문서 우선 순서.',
    items: [
      { name: 'SIMPLE MVP (/message/*)', description: '메시지·감사 카드 등 MVP 영역 미수정.', status: 'PASS', docRef: 'docs/01_CURRENT_PHASE.md' },
      { name: 'Backend Stub 유지', description: '실서버 API 연결 없음.', status: 'INTENTIONAL_DISABLED', docRef: 'docs/INVITATION_BACKEND_STUB.md' },
      { name: '결제·이메일·이벤트', description: '결제/이메일/이벤트 전송 비활성화.', status: 'BLOCKED', docRef: 'docs/02_STRIPE_POLICY.md' },
    ],
  },
];

const STATUS_CLASS: Record<Status, string> = {
  PASS: styles.statusPass,
  INTENTIONAL_DISABLED: styles.statusDisabled,
  BLOCKED: styles.statusBlocked,
};

export default function DevIntegrityPage() {
  return (
    <>
      <div className={styles.backBar}>
        <Link href="/dev" className={styles.backLink}>← Dev Hub</Link>
      </div>
      <h1 className={styles.title}>Integrity Dashboard</h1>
      <p className={styles.subtitle}>
        선언 기반 상태만 표시합니다. 실제 로직 검사는 하지 않습니다.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <p className={styles.sectionDesc}>{section.description}</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>항목</th>
                <th className={styles.th}>설명</th>
                <th className={styles.th}>상태</th>
                <th className={styles.th}>참조 문서</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((row, i) => (
                <tr key={i}>
                  <td className={styles.td}>{row.name}</td>
                  <td className={styles.td}>{row.description}</td>
                  <td className={styles.td}>
                    <span className={STATUS_CLASS[row.status]}>{row.status}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.docRef}>{row.docRef}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer className={styles.devFooter}>
        이 페이지는 API/DB를 호출하지 않습니다. 규칙 변경 시 위 선언을 수동으로 맞춰 주세요.
      </footer>
    </>
  );
}

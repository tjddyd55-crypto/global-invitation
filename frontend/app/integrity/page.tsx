'use client';

/**
 * UI–Router–Contract 무결성 시각화용 페이지.
 * - 목적: 현재 프로젝트에서 존재하는 페이지/기능 목록을 시각적으로 보여주고,
 *   초대장·에디터·데모·샘플 링크를 한 곳에서 확인 가능하게 함.
 * - API/DB 검사는 추후 단계에서 확장. 현재는 Stub 단계.
 * - 외부 API 호출 없음. local const 데이터만 사용.
 */

import React from 'react';
import Link from 'next/link';
import IntegrityCard, { type IntegrityItem } from '@/src/components/integrity/IntegrityCard';
import { invitationIntegrity } from '@/src/integrity/invitationIntegrity';

// 스타일을 모듈 레벨에 두어 JSX 내 숫자 리터럴로 인한 파서 오류 방지 (모든 환경에서 빌드 안정)
const ROOT_STYLE: React.CSSProperties = { maxWidth: '720px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' };
const TOP_BAR_STYLE: React.CSSProperties = { marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' };
const LINK_STYLE: React.CSSProperties = { color: '#0066cc', fontSize: '14px' };
const PROJECT_STYLE: React.CSSProperties = { fontSize: '14px', color: '#666' };
const HINT_STYLE: React.CSSProperties = { marginLeft: '8px', color: '#999' };
const H1_STYLE: React.CSSProperties = { marginBottom: '8px', fontSize: '1.5rem' };
const P_STYLE: React.CSSProperties = { color: '#666', marginBottom: '28px', fontSize: '0.95rem' };
const ASIDE_STYLE: React.CSSProperties = { marginTop: '32px', padding: '16px', background: '#f5f5f5', borderRadius: '8px', fontSize: '0.9rem', color: '#555' };
const QUICK_LINKS_WRAP: React.CSSProperties = { marginBottom: '24px' };
const QUICK_LINKS_LIST: React.CSSProperties = { listStyle: 'none', padding: '0', display: 'flex', gap: '12px', flexWrap: 'wrap' };

/** 메뉴→라우트 연결성 점검용: 존재하는 페이지/데모 링크 (로컬 상수) */
const INTEGRITY_ROUTE_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/integrity', label: '무결성 체크' },
  { href: '/templates', label: '초대장 만들기' },
  { href: '/invitation/sample-wedding', label: '/invitation/sample-wedding' },
  { href: '/invitation/demo-wedding-classic', label: '/invitation/demo-wedding-classic' },
  { href: '/editor/sample-wedding', label: '/editor/sample-wedding' },
  { href: '/editor/demo-wedding-classic', label: '/editor/demo-wedding-classic' },
] as const;

function buildUiItems(): IntegrityItem[] {
  const { ui } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: 'Contract 필드 누락 없음', status: ui.contractFields ? 'ok' : 'error' },
    { text: '비활성 블록(display:none) 유지', status: ui.hiddenBlocksSafe ? 'ok' : 'error' },
    { text: 'Gallery empty -> section hidden', status: 'warning' },
  ];
  return items;
}

function buildApiItems(): IntegrityItem[] {
  const { api } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: '호출 0건 (의도된 상태)', status: api.fetchCalls === 0 ? 'ok' : 'error' },
    { text: 'non-demo slug fetch 차단됨', status: api.demoOnly ? 'ok' : 'error' },
    { text: 'demo/sample만 local data 사용', status: api.demoOnly ? 'ok' : 'error' },
  ];
  return items;
}

function buildRouterItems(): IntegrityItem[] {
  const { router } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: '/invitation/[slug] 존재', status: router.invitationRoute ? 'ok' : 'error' },
    { text: '/editor/[slug] demo 전용 제한 정상', status: router.editorDemoOnly ? 'ok' : 'error' },
    { text: 'not_found 분기 정상', status: router.notFoundGuard ? 'ok' : 'error' },
  ];
  return items;
}

function buildContractItems(): IntegrityItem[] {
  const { contract } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: 'INVITATION_RUNTIME_CONTRACT.md 기준', status: contract.runtimeContractMatch ? 'ok' : 'error' },
    { text: 'UI 접근 필드 외 사용 없음', status: contract.runtimeContractMatch ? 'ok' : 'error' },
    { text: '문서 없는 접근 0건', status: !contract.undocumentedUsage ? 'ok' : 'error' },
  ];
  return items;
}

function buildGovernanceItems(): IntegrityItem[] {
  const { governance } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: 'SIMPLE MVP 미변경', status: governance.simpleMvpUntouched ? 'ok' : 'error' },
    { text: 'Backend Stub 유지', status: governance.backendStubOnly ? 'ok' : 'error' },
    { text: '문서 → 코드 → QA 순서 준수', status: governance.backendStubOnly ? 'ok' : 'error' },
  ];
  return items;
}

function overallStatus(items: IntegrityItem[]): 'ok' | 'warning' | 'error' {
  if (items.some((i) => i.status === 'error')) return 'error';
  if (items.some((i) => i.status === 'warning')) return 'warning';
  return 'ok';
}

export default function IntegrityPage() {
  const uiItems = buildUiItems();
  const apiItems = buildApiItems();
  const routerItems = buildRouterItems();
  const contractItems = buildContractItems();
  const governanceItems = buildGovernanceItems();

  return (
    <div style={ROOT_STYLE}>
      <div style={TOP_BAR_STYLE}>
        <Link href="/" style={LINK_STYLE}>
          ← Home
        </Link>
        <div style={PROJECT_STYLE}>
          [ 프로젝트 선택 ] <strong>Invitation</strong>
          <span style={HINT_STYLE}>Other project later</span>
        </div>
      </div>

      <h1 style={H1_STYLE}>무결성 체크 (Integrity)</h1>
      <p style={P_STYLE}>
        지금 작업 중인 영역의 건강 상태를 한눈에 확인합니다.
      </p>

      <section style={QUICK_LINKS_WRAP}>
        <h2 style={{ marginBottom: '8px', fontSize: '1rem' }}>존재하는 페이지 / Quick links</h2>
        <ul style={QUICK_LINKS_LIST}>
          {INTEGRITY_ROUTE_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} style={LINK_STYLE}>{label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <IntegrityCard
        title="🧩 UI Integrity"
        status={overallStatus(uiItems)}
        items={uiItems}
        description="Contract 필드, 비활성 블록, 갤러리 빈 배열 처리."
      />

      <IntegrityCard
        title="🔌 API Integrity (Stub)"
        status={overallStatus(apiItems)}
        items={apiItems}
        description="Stub 단계: invitation/editor에서 fetch 0건, demo/sample만 로컬 데이터."
      />

      <IntegrityCard
        title="🗂 Router Integrity"
        status={overallStatus(routerItems)}
        items={routerItems}
        description="/invitation/[slug], /editor/[slug] 및 not_found 분기."
      />

      <IntegrityCard
        title="📄 Contract Integrity"
        status={overallStatus(contractItems)}
        items={contractItems}
        description="INVITATION_RUNTIME_CONTRACT.md 기준, 문서 없는 필드 접근 없음."
      />

      <IntegrityCard
        title="🧠 Governance Check"
        status={overallStatus(governanceItems)}
        items={governanceItems}
        description="SIMPLE MVP / Stub / 문서 우선 순서 유지."
      />

      <aside style={ASIDE_STYLE}>
        <p style={{ margin: '0' }}>
          이 페이지는 &quot;무결성 확인용&quot;이며<br />
          실제 API / DB / 외부 서비스는 호출하지 않습니다.
        </p>
        <p style={{ margin: '12px 0 0 0' }}>
          문서에 없는 연결은 버그로 간주됩니다.
        </p>
      </aside>
    </div>
  );
}

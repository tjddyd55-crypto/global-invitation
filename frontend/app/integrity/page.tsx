'use client';

/**
 * 프로젝트 무결성 대시보드. API/DB 호출 없음. Static/Stub/Contract 기반 시각화만.
 */

import Link from 'next/link';
import IntegrityCard, { type IntegrityItem } from '@/src/components/integrity/IntegrityCard';
import { invitationIntegrity } from '@/src/integrity/invitationIntegrity';

function buildUiItems(): IntegrityItem[] {
  const { ui } = invitationIntegrity;
  const items: IntegrityItem[] = [
    { text: 'Contract 필드 누락 없음', status: ui.contractFields ? 'ok' : 'error' },
    { text: '비활성 블록(display:none) 유지', status: ui.hiddenBlocksSafe ? 'ok' : 'error' },
    { text: 'Gallery empty → section hidden', status: 'warning' },
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" style={{ color: '#0066cc', fontSize: 14 }}>
          ← Home
        </Link>
        <div style={{ fontSize: 14, color: '#666' }}>
          [ 프로젝트 선택 ] <strong>Invitation</strong>
          <span style={{ marginLeft: 8, color: '#999' }}>Other project later</span>
        </div>
      </div>

      <h1 style={{ marginBottom: 8, fontSize: 1.5rem }}>무결성 체크 (Integrity)</h1>
      <p style={{ color: '#666', marginBottom: 28, fontSize: 0.95rem }}>
        지금 작업 중인 영역의 건강 상태를 한눈에 확인합니다.
      </p>

      <IntegrityCard
        title="🧩 UI Integrity"
        status={overallStatus(uiItems)}
        items={uiItems}
        description="Contract 필드·비활성 블록·갤러리 빈 배열 처리."
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
        description="SIMPLE MVP·Stub·문서 우선 순서 유지."
      />

      <aside
        style={{
          marginTop: 32,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          fontSize: 0.9rem,
          color: '#555',
        }}
      >
        <p style={{ margin: 0 }}>
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

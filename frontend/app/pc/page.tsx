/* eslint-disable i18next/no-literal-string */
import Link from 'next/link';
import PlatformSwitcher from '@/src/ui/shared/PlatformSwitcher';

export default function PcHomePage() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
      <header>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>데스크톱 대시보드</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
          PC 전용 관리 화면 입니다. 복잡한 편집·리포트·관리 기능은 여기에만 둡니다.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card href="/pc/templates" title="템플릿" desc="모든 템플릿 브라우징·검색·편집" />
        <Card href="/pc/dashboard" title="내 초대장" desc="발송 현황·분석·게스트 목록" />
        <Card href="/pc/settings" title="설정" desc="계정·결제·팀 권한" />
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af' }}>
        <PlatformSwitcher target="mobile" redirectTo="/m">
          모바일 버전 보기 →
        </PlatformSwitcher>
      </div>
    </section>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 20,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        textDecoration: 'none',
        color: '#111',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{desc}</div>
    </Link>
  );
}

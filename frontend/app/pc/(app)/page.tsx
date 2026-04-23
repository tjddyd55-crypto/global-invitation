/* eslint-disable i18next/no-literal-string */
import Link from 'next/link';
import PlatformSwitcher from '@/src/ui/shared/PlatformSwitcher';

export default function PcHomePage() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040 }}>
      <header>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>데스크톱 대시보드</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
          PC 전용 관리 화면입니다. 템플릿 검색·편집·리포트 등 복잡한 관리 기능을 여기에서 사용하세요.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card href="/pc/templates" title="템플릿 둘러보기" desc="모든 템플릿을 브라우징하고 컨셉별로 시작" />
        <Card href="/pc/my-invitations" title="내 초대장" desc="작성 중·발행된 초대장을 관리" />
        <Card href="/pc/dashboard" title="대시보드" desc="발송 현황·통계·게스트 목록" />
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
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
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{desc}</div>
    </Link>
  );
}

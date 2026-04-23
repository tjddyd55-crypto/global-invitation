/* eslint-disable i18next/no-literal-string */
import Link from 'next/link';
import PlatformSwitcher from '@/src/ui/shared/PlatformSwitcher';

export default function MobileHomePage() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>모바일 홈</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
          PWA 전용 UI 입니다. 이곳은 앞으로 시트·풀스크린 뷰 중심으로 재구성됩니다.
        </p>
      </header>

      <div style={{ display: 'grid', gap: 10 }}>
        <Link href="/m/templates" style={primaryBtn}>템플릿 둘러보기</Link>
        <Link href="/m/dashboard" style={secondaryBtn}>내 초대장</Link>
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
        <PlatformSwitcher target="desktop" redirectTo="/pc" className="">
          데스크톱 버전 보기 →
        </PlatformSwitcher>
      </div>
    </section>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  padding: '14px 16px',
  background: '#4f46e5',
  color: '#fff',
  borderRadius: 12,
  fontWeight: 600,
  textDecoration: 'none',
};

const secondaryBtn: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  padding: '14px 16px',
  background: '#fff',
  color: '#374151',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontWeight: 600,
  textDecoration: 'none',
};

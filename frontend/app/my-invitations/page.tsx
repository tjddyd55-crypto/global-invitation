'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MyInvitationsScreen from '@/src/features/invitations/ui/mobile/MyInvitationsScreen';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { useMyInvitations } from '@/src/features/invitations/model/useMyInvitations';
import type { InvitationSummary } from '@/src/lib/api';
import Link from 'next/link';

/**
 * 공식 내 초대장 — viewport(1024) shell 전환.
 * 데스크톱은 기존 목록 UI를 PcShell 안에 배치 (전용 PC 컴포넌트 미이식 구간).
 */
export default function MyInvitationsPage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <MyInvitationsScreen />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <DesktopMyInvitationsContent />
        </PcShell>
      }
    />
  );
}

function DesktopMyInvitationsContent() {
  const { items, status, reload } = useMyInvitations();

  return (
    <RequireAuth nextPath="/my-invitations">
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1F2937' }}>내 초대장</h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 14 }}>
              저장된 초대장을 편집하거나 공개 페이지를 확인할 수 있습니다.
            </p>
          </div>
          <Link
            href="/templates"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 44,
              padding: '0 18px',
              borderRadius: 12,
              background: '#4F46E5',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ＋ 새로 만들기
          </Link>
        </header>

        {status === 'loading' && <p style={{ color: '#6B7280' }}>불러오는 중…</p>}
        {status === 'error' && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#B42318' }}>목록을 불러오지 못했습니다.</p>
            <button type="button" onClick={() => void reload()}>
              다시 시도
            </button>
          </div>
        )}
        {(status === 'empty' || (status === 'ready' && items.length === 0)) && (
          <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 20 }}>
            <p style={{ color: '#6B7280' }}>아직 만든 초대장이 없습니다</p>
            <Link href="/templates" style={{ color: '#4F46E5', fontWeight: 600 }}>
              첫 초대장 만들기
            </Link>
          </div>
        )}
        {status === 'ready' && items.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {items.map((item) => (
              <InvitationRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </RequireAuth>
  );
}

function InvitationRow({ item }: { item: InvitationSummary }) {
  return (
    <li
      style={{
        background: '#fff',
        border: '1px solid #E5E1D8',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div>
        <strong style={{ color: '#1F2937' }}>{item.title || '제목 없음'}</strong>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          {item.status === 'published' ? '공개됨' : '초안'}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
        <Link href={`/editor/${item.id}`} style={{ color: '#4F46E5', fontWeight: 600, fontSize: 13 }}>
          수정
        </Link>
        {item.shareSlug ? (
          <Link href={`/i/${item.shareSlug}`} style={{ color: '#6B7280', fontWeight: 600, fontSize: 13 }}>
            보기
          </Link>
        ) : null}
        <Link href={`/my-invitations/${item.id}/rsvp`} style={{ color: '#6B7280', fontWeight: 600, fontSize: 13 }}>
          참석 관리
        </Link>
        <Link href={`/my-invitations/${item.id}/comments`} style={{ color: '#6B7280', fontWeight: 600, fontSize: 13 }}>
          댓글 관리
        </Link>
      </div>
    </li>
  );
}

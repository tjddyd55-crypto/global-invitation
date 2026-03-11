'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Invitation } from '@/src/lib/api';
import { getSharedInvitationBySlug } from '@/src/lib/api';
import { getTemplateRenderer } from '@/src/templates/registry';
import { isWeddingInvitationData } from '@/src/invitation/schemas';
import RSVPForm from '@/src/components/rsvp/RSVPForm';

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

export default function PublicShareInvitationPage() {
  const params = useParams();
  const shareSlug = resolveSafeSlug(params.slug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSharedInvitation() {
      if (!shareSlug) {
        setError('유효하지 않은 공유 링크입니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const shared = await getSharedInvitationBySlug(shareSlug);
        if (!mounted) return;
        setInvitation(shared);
      } catch {
        if (!mounted) return;
        setError('공유 초대장을 불러올 수 없습니다.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void loadSharedInvitation();
    return () => {
      mounted = false;
    };
  }, [shareSlug]);

  const runtimeData = useMemo(() => invitation?.dataJson ?? invitation?.data ?? null, [invitation]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>초대장을 찾을 수 없습니다.</h1>
        <p style={{ color: '#666' }}>{error || '유효하지 않은 링크입니다.'}</p>
      </div>
    );
  }

  const Template = getTemplateRenderer(invitation.templateKey);
  if (!Template || !runtimeData) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>렌더링할 수 없는 템플릿입니다.</h1>
        <p style={{ color: '#666' }}>템플릿 설정을 확인해 주세요.</p>
      </div>
    );
  }

  const showRsvp = isWeddingInvitationData(runtimeData) && runtimeData.rsvp?.enabled === true;

  return (
    <>
      <Template
        data={runtimeData}
        invitationSlug={invitation.shareSlug || shareSlug}
        showPlayButton={false}
        showRsvp={showRsvp ? false : undefined}
      />
      {showRsvp && <RSVPForm invitationSlug={invitation.slug} />}
    </>
  );
}

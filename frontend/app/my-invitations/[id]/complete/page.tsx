'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import PublishCompleteScreen from '@/src/features/invitations/ui/shared/PublishCompleteScreen';
import { getInvitationForEditor } from '@/src/lib/api';
import { buildAbsolutePublicInvitationUrl } from '@/src/lib/publicInvitation';

export default function PublishCompletePage() {
  const params = useParams();
  const invitationId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [shareUrl, setShareUrl] = useState('');
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!invitationId) return;
      try {
        const invitation = await getInvitationForEditor(invitationId);
        if (!mounted) return;
        setTitle(invitation.title || null);
        if (invitation.shareSlug) {
          setShareUrl(buildAbsolutePublicInvitationUrl(window.location.origin, invitation.shareSlug));
        } else {
          setError('아직 공개 링크가 없습니다. 에디터에서 먼저 공개해 주세요.');
        }
      } catch {
        if (mounted) setError('초대장 정보를 불러오지 못했습니다.');
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [invitationId]);

  return (
    <RequireAuth nextPath={`/my-invitations/${invitationId}/complete`}>
      {error && <p style={{ padding: 24, color: 'var(--gi-danger)' }}>{error}</p>}
      {!error && shareUrl && (
        <PublishCompleteScreen invitationId={invitationId} shareUrl={shareUrl} title={title} />
      )}
    </RequireAuth>
  );
}
